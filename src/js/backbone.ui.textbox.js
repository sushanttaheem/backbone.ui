/*globals Backbone, _, jQuery */

(function(Backbone, _, $) {
	"use strict";

	var ENTER = Backbone.UI.KEYS.ENTER;

	var classes = {
		events : {
			main : '.textbox'
		},

		triggers : {
			focused : 'txt:focused',
			changeValue : 'txt:change:value'
		},

		ui : {
			empty : 'ui-txt-empty',
			clear : 'ui-txt-clear',
			disabled : 'ui-txt-disabled',
			error : 'ui-txt-error'
		},

		js : {
			input : '.js-txt-input',
			empty : '.js-txt-empty',
			clear : '.js-txt-clear',
			error : '.js-txt-error'
		}
	};

	var textboxViewEvents = {};
		textboxViewEvents['keypress' + classes.events.main + ' ' + classes.js.input] = '_handleInputKeyPressEvent';
		textboxViewEvents['keyup' + classes.events.main + ' ' + classes.js.input] = '_handleInputKeyUpEvent';
		textboxViewEvents['focus' + classes.events.main + ' ' + classes.js.input] = '_handleInputFocusEvent';
		textboxViewEvents['blur' + classes.events.main + ' ' + classes.js.input] = '_handleInputBlurEvent';
		textboxViewEvents['click' + classes.events.main + ' ' + classes.js.empty] = '_handleEmptyMessageClickEvent';
		textboxViewEvents['click' + classes.events.main + ' ' + classes.js.clear] = '_handleClearButtonClickEvent';

	var TextboxModel = Backbone.UI.ComponentModel.extend({
		defaults : {
			value : null,
			type : 'text',
			disabled : false,
			tabIndex : 1,
			template : '#tpl_textbox',
			emptyMessage : '',
			clearButton : false,
			live : false,
			invalidMessage : '',
			regexp : null,

			error : false,

			//type 'number'
			min : 0,
			max : 10
		},

		initialize : function() {

		},

		/**
		 * Returns tabindex specified by developer
		 */
		getTabIndex : function() {
			return this.get('tabIndex');
		},

		/**
		 * Returns information which is displayed when there is no value
		 * specified in component
		 */
		getEmptyMessage : function() {
			return this.get('emptyMessage');
		},

		/**
		 * Returns value of the component
		 */
		getValue : function() {
			return this.get('value');
		},

		/**
		 * Returns value which was in the component before the last
		 * one has been specified
		 */
		getPreviousValue : function() {
			return this.previous('value');
		},

		getRegExp : function() {
			return this.get('regexp');
		},

		getType : function() {
			return this.get('type');
		},

		getError : function(value) {
			return this.get('error');
		},

		setError : function(value) {
			this.set({error : value});
		},

		setValue : function(value, props) {
			props = props || {};

			/*var type = this.getType(), max, min, regexp;

			if (!props.force) {
				if (type === 'text') {
					regexp = this.getRegExp();

					if (regexp) {
						if (!new RegExp(regexp).test(value)) {
							return this.setError({msg : "Value doesn't match regexp", value : value, suggestion : ''});
						}
					}
				}
				else if (type === 'number') {
					value = parseInt(value, 10) || 0;
					max = this.getMax();
					min = this.getMin();

					if (value > max) {
						return this.setError({msg : "Value is too big", value : value, suggestion : max});
					}

					if (value < min) {
						return this.setError({msg : "Value is too small", value : value, suggestion : min});
					}
				}
				else {
					throw "Unsupported Backbone.UI.Textbox component type: " + type;
				}
			}

			this.setError(false);*/
			this.set({value : value}, {silent : props.silent});

			/*return true;*/
		},

		/**
		 * Determinates if clear button should be visible or not
		 */
		showClearButton : function() {
			return this.get('clearButton');
		},

		/**
		 * Determinates if value is set
		 */
		isEmpty : function() {
			var value = this.getValue();

			return value === null || value === '';
		},

		isError : function() {
			return this.get('error');
		},

		isLiveTypingEnabled : function() {
			return this.get('live');
		}
	});

	var TextboxView = Backbone.UI.ComponentView.extend({
		events : textboxViewEvents,

		componentClassName : classes.events.main,

		liveTypingTimer : null,

		$input : null,
		$empty : null,
		$clear : null,
		$error : null,

		initialize : function() {
			var model = this.model;

			this.controller = this.options.controller;

			model.on('change:value', this._handleValueChange, this);
			model.on('change:disabled', this._handleDisabledChange, this);
			model.on('change:error', this._handleErrorChange, this);

			this.template = this.getTemplate();

			this.render();
		},

		render : function() {
			var model = this.model;

			this.$el.html(this.template({
				value : model.getValue(),
				emptyMessage : model.getEmptyMessage(),
				tabIndex : model.getTabIndex() || Backbone.UI.getNextTabIndex()
			}));

			this.$input = this.$el.find(classes.js.input);
			this.$empty = this.$el.find(classes.js.empty);
			this.$clear = this.$el.find(classes.js.clear);
			this.$error = this.$el.find(classes.js.error);

			if (!this.$input.is('input')) {
				throw "Skin should contain 'input' HTMLElement.";
			}

			//Apply default settings on the HTML nodes
			this._handleDisabledChange();
			this.checkForEmptyMessage();
			this.checkForClearButton();
			this._handleErrorChange();
		},

		checkForEmptyMessage : function() {
			var model = this.model;

			this[model.isEmpty() && !model.isError() ? 'showEmptyMessage' : 'hideEmptyMessage']();
		},

		showEmptyMessage : function() {
			this.$el.addClass(classes.ui.empty);
		},

		hideEmptyMessage : function() {
			this.$el.removeClass(classes.ui.empty);
		},

		checkForClearButton : function() {
			var model = this.model;

			if (model.showClearButton() && !model.isEmpty()) {
				this.showClearButton();
			}
			else {
				this.hideClearButton();
			}
		},

		showClearButton : function() {
			this.$el.addClass(classes.ui.clear);
		},

		hideClearButton : function() {
			this.$el.removeClass(classes.ui.clear);
		},

		/**
		 * EVENTS
		 */
		_handleErrorChange : function() {
			var model = this.model, error = model.getError();

			if (model.isError()) {
				this.$error.html(error.msg);
				this.$el.addClass(classes.ui.error);
			}
			else {
				this.$el.removeClass(classes.ui.error);
			}
		},

		_handleInputKeyUpEvent : function() {
			var model = this.model,
				_self = this;

			if (model.isDisabled()) {
				return;
			}

			if (model.isLiveTypingEnabled()) {
				window.clearTimeout(this.liveTypingTimer);

				this.liveTypingTimer = window.setTimeout(function() {
					_self.controller._handleLiveTyping(_self.$input.val());
				}, 250);
			}
		},

		_handleInputBlurEvent : function() {
			this.controller._handleInputBlurEvent(this.$input.val());

			this.checkForEmptyMessage();
		},

		_handleDisabledChange : function() {
			var isDisabled = this.model.isDisabled();

			this.$el.toggleClass(classes.ui.disabled, isDisabled);

			if (isDisabled) {
				this.$input.attr('disabled', 'disabled');
			}
			else {
				this.$input.removeAttr('disabled');
			}
		},

		_handleEmptyMessageClickEvent : function() {
			if (this.model.isDisabled()) {
				return;
			}

			this.hideEmptyMessage();
			this.$input.focus();
		},

		_handleInputFocusEvent : function() {
			var model = this.model;

			if (model.isDisabled()) {
				return;
			}

			this.hideEmptyMessage();

			this.controller.trigger(classes.triggers.focused, this.controller);
		},

		_handleValueChange : function() {
			var model = this.model;

			this.$input.val(model.getValue()).focus();

			this.checkForEmptyMessage();
			this.checkForClearButton();
			this._handleErrorChange();
		},

		_handleInputKeyPressEvent : function(e) {
			this.controller._handleInputKeyPressEvent(e.keyCode, this.$input.val());
		},

		_handleClearButtonClickEvent : function() {
			this.hideClearButton();
			this.$input.val('');

			this.controller._handleClearButtonClickEvent();
		}
	});

	/**
	 * Controller
	 */
	Backbone.UI.Textbox = Backbone.UI.ComponentController.extend({
		initialize : function() {
			var settings = this.options.settings;

			this.model = new TextboxModel(settings);

			this.view = new TextboxView({
				el : this.$el,
				model : this.model,
				controller : this
			});

			//Events
			this.model.on('change:value', this._handleValueChange, this);
		},

		_handleValueChange : function() {
			this.trigger(classes.triggers.changeValue, this, this.model.getValue(), this.model.getPreviousValue());
		},

		_handleInputKeyPressEvent : function(keyCode, value) {
			var model = this.model;

			if (model.isDisabled()) {
				return;
			}

			//Enter
			if (keyCode === ENTER) {
				model.setValue(value);
				console.log("Current value in the model: ", model.getValue());
			}
		},

		_handleInputBlurEvent : function(value) {
			var model = this.model;

			if (model.isDisabled()) {
				return;
			}

			model.setValue(value);
		},

		_handleClearButtonClickEvent : function() {
			this.model.setValue('');
		},

		_handleLiveTyping : function(value) {
			this.model.setValue(value);
		},

		setValue : function(value) {
			this.model.setValue(value);

			return this;
		},

		getValue : function() {
			return this.model.getValue();
		}
	});
}(Backbone, _, jQuery));