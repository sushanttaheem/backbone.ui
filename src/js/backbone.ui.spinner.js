/*globals Backbone, _, jQuery */

(function(Backbone, _, $) {
	"use strict";

	var ENTER = Backbone.UI.KEYS.ENTER,
		KEY_UP = Backbone.UI.KEYS.KEY_UP,
		KEY_DOWN = Backbone.UI.KEYS.KEY_DOWN;

	var default_settings = {
		type_integer : {
			value : 0,
			step : 500,
			max : Infinity,
			min : 0
		},
		type_float : {
			value : 0,
			step : 500,
			max : Infinity,
			min : 0
		}
	};

	var component = {
		className : '.spinner',
		events : {
			view : {
				'click.spinner .js-sp-btn-up' : '_handleButtonUpClickEvent',
				'click.spinner .js-sp-btn-down' : '_handleButtonDownClickEvent',
				'blur.spinner .js-sp-input' : '_handleInputBlurEvent',
				'keypress.spinner .js-sp-input' : '_handleInputKeyPressEvent'
			},
			model : {
				changeType : 'change:type',
				changeMax : 'change:max',
				changeMin : 'change:min',
				changeDisabled : 'change:disabled',
				changeValue : 'change:value'
			}
		},

		triggers : {
			/**
			 * @private
			 */
			revertValue : 'sp:revert:value',

			/**
			 * Triggered every time when value is changed
			 *
			 * @event sp:change:value
			 * @param {Object} Backbone.UI.Spinner
			 * @param {Number|String} value
			 * @param {Number|String} previous value
			 */
			changeValue : 'sp:change:value',

			/**
			 * Triggered when max setting changed
			 *
			 * @event sp:change:max
			 * @param {Object} Backbone.UI.Spinner
			 * @param {Number} max
			 */
			changeMax : 'sp:change:max',

			/**
			 * Triggered when min setting changed
			 *
			 * @event sp:change:min
			 * @param {Object} Backbone.UI.Spinner
			 * @param {Number} min
			 */
			changeMin : 'sp:change:min'
		},
		classes : {
			ui : {
				disabled : 'ui-sp-disabled'
			},

			js : {
				input : '.js-sp-input',
				buttonUp : '.js-sp-btn-up',
				buttonDown : '.js-sp-btn-down'
			}
		}
	};

	/**
	 * Spinner Model
	 *
	 * @extends Backbone.UI.ComponentModel
	 */
	var SpinnerModel = Backbone.UI.ComponentModel.extend({
		defaults : {
			template : '#tpl_spinner',
			disabled : false,
			tabIndex : 1
		},

		initialize : function() {
			this.on(component.events.model.changeType, this._handleTypeChange, this);
			this.on(component.events.model.changeMax, this._handleMaxChange, this);
			this.on(component.events.model.changeMin, this._handleMinChange, this);
		},

		/**
		 * Model event handlers
		 */
		_handleTypeChange : function() {
			this.setValue(this.getValue());
		},

		_handleMinChange : function() {
			this.setValue(this.getValue());
		},

		_handleMaxChange : function() {
			this.setValue(this.getValue());
		},

		_changeValue : function(value, step, sign, silent) {
			var currentValue = this.getValue(), type = this.getType(),
				max = this.getMax(), min = this.getMin();

			value = type === 'integer'
				? parseInt(value, 10) + sign * step
				: (type === 'float'
					? Math.round((parseFloat(value) + sign * step) * 100) / 100
					: value);

			if (value > max) {
				value = max;
			}
			else if (value < min) {
				value = min;
			}

			this.set('value', value, {silent : silent});

			if (currentValue === value) {
				this.trigger(component.triggers.revertValue, this.controller);
			}
		},

		/**
		 * Returns spinner's type
		 *
		 * @method getType
		 * @protected
		 *
		 * @return {String}
		 */
		getType : function() {
			return this.get('type');
		},

		/**
		 * Sets spinner's type
		 *
		 * @method setType
		 * @protected
		 */
		setType : function(value) {
			this.set('type', value);
		},

		/**
		 * Returns step setting
		 *
		 * @method getStep
		 * @protected
		 *
		 * @return {Number}
		 */
		getStep : function() {
			return this.get('step');
		},

		/**
		 * Sets step setting to new one
		 *
		 * @method setStep
		 * @protected
		 *
		 * @param {Number} value
		 */
		setStep : function(value) {
			this.set('step', value);
		},

		/**
		 * Returns max setting
		 *
		 * @method getMax
		 * @protected
		 *
		 * @return {Number}
		 */
		getMax : function() {
			return this.get('max');
		},

		/**
		 * Sets max to new one. Changes value if exceeded limit.
		 *
		 * @method setMax
		 * @protected
		 *
		 * @param {Number} max
		 */
		setMax : function(max) {
			var value = this.getValue();

			//Set new max
			this.set('max', max);

			if (value > max) {
				this.setValue(max);
			}
		},

		/**
		 * Returns min setting
		 *
		 * @method getMin
		 * @protected
		 *
		 * @return {Number}
		 */
		getMin : function() {
			return this.get('min');
		},

		/**
		 * Sets min to new one. Changes value if exceeded limit.
		 *
		 * @method setMin
		 * @protected
		 *
		 * @param {Number} min
		 */
		setMin : function(min) {
			var value = this.getValue();

			//Set new min
			this.set('min', min);

			if (value < min) {
				this.setValue(min);
			}
		},

		/**
		 * Sets new value of the spinner. Changes it, if exceeded limit.
		 *
		 * @method setValue
		 * @protected
		 *
		 * @param {Number|String} value   new value
		 * @param {Boolean} silent    when set to true, prevents triggering events
		 */
		setValue : function(value, silent) {
			this._changeValue(value, 0, 1, silent);
		},

		/**
		 * Returns value of spinner
		 *
		 * @method getValue
		 * @protected
		 *
		 * @return {Number|String}
		 */
		getValue : function() {
			return this.get('value');
		},

		/**
		 * Returns previous value of spinner.
		 * (Works only when change:value event has been triggered)
		 *
		 * @method getPreviousValue
		 * @protected
		 *
		 * @return {Number|String}
		 */
		getPreviousValue : function(value) {
			return this.previous('value');
		},

		/**
		 * Increases value by step
		 *
		 * @method stepUp
		 * @protected
		 *
		 * @param {Number} multiplier   step is multiplied by this value, default is 1
		 */
		stepUp : function(multiplier) {
			var step = this.getStep();

			step *= multiplier || 1;

			this._changeValue(this.getValue(), step, 1);
		},

		/**
		 * Decreases value by step
		 *
		 * @method stepDown
		 * @protected
		 *
		 * @param {Number} multiplier   step is multiplied by this value, default is 1
		 */
		stepDown : function(multiplier) {
			var step = this.getStep();

			step *= multiplier || 1;

			this._changeValue(this.getValue(), step, -1);
		}
	});

	/**
	 * Spinner View
	 *
	 * @extends Backbone.UI.ComponentView
	 */
	var SpinnerView = Backbone.UI.ComponentView.extend({
		componentClassName : component.className,

		$input : null,

		events : component.events.view,

		initialize : function() {
			var model = this.model;

			this.controller = this.options.controller;

			model.on(component.events.model.changeDisabled, this._handleDisabledChange, this);
			model.on(component.events.model.changeValue, this._handleValueChange, this);
			model.on(component.triggers.revertValue, this._handleRevertChange, this);

			this.template = this.getTemplate();

			this.render();
		},

		render : function() {
			this.$el.html(this.template(this.model.toJSON()));

			this.$input = this.$el.find(component.classes.js.input);

			if (!this.$input.is('input')) {
				throw "Skin should contain 'input' HTMLElement.";
			}

			//Apply default settings on the HTML nodes
			this._handleDisabledChange();
		},

		_handleButtonUpClickEvent : function() {
			this.controller._handleButtonUpClickEvent();
		},

		_handleButtonDownClickEvent : function() {
			this.controller._handleButtonDownClickEvent();
		},

		_handleInputBlurEvent : function() {
			this.controller._handleInputBlurEvent(this.$input.val());
		},

		_handleInputKeyPressEvent : function(e) {
			this.controller._handleInputKeyPressEvent(this.$input.val(), e.keyCode, e.ctrlKey, e.shiftKey);
		},

		_handleValueChange : function() {
			//Change value in the HTML
			this.$input.val(this.model.getValue());
		},

		_handleRevertChange : function() {
			this.$input.val(this.model.getValue());
		},

		_handleDisabledChange : function() {
			var isDisabled = this.model.isDisabled();

			this.$el.toggleClass(component.classes.ui.disabled, isDisabled);

			if (isDisabled) {
				this.$input.attr('disabled', 'disabled');
			}
			else {
				this.$input.removeAttr('disabled');
			}
		}
	});

	/**
 * It's a component with input and two buttons which allows to increment
 * or decrement value by some amount which can be determinated as a 'step'.
 * It also allows to change value directly in the input field. The value can
 * be limited by 'max' and 'min' settings
 *
 * @param params
 *    @property {Number} value       value of the spinner
 *    @property {Number} step        determinates step which will be take after click on button
 *    @property {Number} max         determinates maximal value which can be stored in the component
 *    @property {Number} min         determinates minimal value which can be stored in the component
 *    @property {Boolean} disabled   determinates if component reacts on user's actions
 *    @property {String} type        determinates how spinner will interprete values
 *	      Possible values:
 *        - 'integer'   treats all values as intergers
 *        - 'float'     treats all values as floats
 *    @property {String} template    determinates template source
 *	  @property {Number} tabIndex    determinates the HTML tabindex attribute
 *
 * Triggered events:e
 * - sp:change:value    triggered when value was changed
 * - sp:change:max      triggered when max setting is changed
 * - sp:change:min      triggered when min setting is changed
 *
 * Css classes:
 * - ui-sp-disabled   applied when component is disabled
 *
 * JS classes
 * - js-sp-input      input html node
 * - js-sp-btn-up     button up html node
 * - js-sp-btn-down   button down html node
 */
	Backbone.UI.Spinner = Backbone.UI.Component.extend({
		initialize : function() {
			var settings = this.options.settings,
				type = settings.type;

			if (!default_settings['type_' + settings.type]) {
				throw "Unsupported Backbone.UI.Spinner type";
			}

			//Model
			this.model = new SpinnerModel(_.extend({tabIndex : Backbone.UI.getNextTabIndex()}, default_settings['type_' + settings.type], settings));

			//View
			this.view = new SpinnerView({
				el : this.$el,
				model : this.model,
				controller : this
			});

			//Events
			this.model.on(component.events.model.changeValue, this._handleValueChange, this);
			this.model.on(component.events.model.changeMax, this._handleMaxChange, this);
			this.model.on(component.events.model.changeMin, this._handleMinChange, this);
		},

		_handleButtonUpClickEvent : function() {
			var model = this.model;

			if (model.isDisabled()) {
				return;
			}

			model.stepUp();
		},

		_handleButtonDownClickEvent : function() {
			var model = this.model;

			if (model.isDisabled()) {
				return;
			}

			model.stepDown();
		},

		_handleInputBlurEvent : function(value) {
			this.model.setValue(value, true);
		},

		_handleInputKeyPressEvent : function(value, key, ctrl, shift) {
			var model = this.model,
				max = model.getMax(), min = model.getMin(),
				restricted_max = max === Infinity || max === -Infinity,
				restricted_min = min === Infinity || min === -Infinity;

			if (model.isDisabled()) {
				return;
			}

			if (key === ENTER) {
				model.setValue(value);
			}
			else if (key === KEY_UP && shift && !restricted_max) {
				model.setValue(max);
			}
			else if (key === KEY_UP && ctrl) {
				model.stepUp(2);
			}
			else if (key === KEY_UP) {
				model.stepUp();
			}
			else if (key === KEY_DOWN && shift && !restricted_min) {
				model.setValue(min);
			}
			else if (key === KEY_DOWN && ctrl) {
				model.stepDown(2);
			}
			else if (key === KEY_DOWN) {
				model.stepDown();
			}
		},

		_handleValueChange : function() {
			var model = this.model;

			this.trigger(component.triggers.changeValue, this, model.getValue(), model.getPreviousValue());
		},

		_handleMaxChange : function() {
			this.trigger(component.triggers.changeMax, this, this.model.getMax());
		},

		_handleMinChange : function() {
			this.trigger(component.triggers.changeMin, this, this.model.getMin());
		},

		/**
		 * Public methods
		 */

		/**
		 * Sets value of spinner
		 *
		 * @param {Number} value
		 *
		 * @return {Object} Backbone.UI.Spinner
		 */
		setValue : function(value) {
			this.model.setValue(value);

			return this;
		},

		/**
		 * Returns value of spinner
		 *
		 * @return {Number}
		 */
		getValue : function() {
			return this.model.getValue();
		},

		/**
		 * Increases value of spinner by predefined step
		 *
		 * @param {Number} multiplier   amount the value is multilpied by
		 *
		 * @return {Object} Backbone.UI.Spinner
		 */
		stepUp : function(multiplier) {
			this.model.stepUp(multiplier);

			return this;
		},

		/**
		 * Decreases value of spinner by predefined step
		 *
		 * @param {Number} multiplier   amount the value is multilpied by
		 *
		 * @return {Object} Backbone.UI.Spinner
		 */
		stepDown : function(multiplier) {
			this.model.stepDown(multiplier);

			return this;
		},

		/**
		 * Sets maximal allowed value in spinner
		 *
		 * @param {Number} value
		 *
		 * @return {Object} Backbone.UI.Spinner
		 */
		setMax : function(value) {
			this.model.setMax(value);

			return this;
		},

		/**
		 * Returns maximal allowed value in spinner
		 *
		 * @return {Number}
		 */
		getMax : function() {
			return this.model.getMax();
		},

		/**
		 * Sets minimal allowed value in spinner
		 *
		 * @param {Number} value
		 *
		 * @return {Object} Backbone.UI.Spinner
		 */
		setMin : function(value) {
			this.model.setMin(value);

			return this;
		},

		/**
		 * Returns minimal allowed value in spinner
		 *
		 * @return {Number}
		 */
		getMin : function() {
			return this.model.getMin();
		}
	});
}(Backbone, _, jQuery));