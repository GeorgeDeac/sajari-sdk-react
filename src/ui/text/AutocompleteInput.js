import React from "react";
import { findDOMNode } from "react-dom";
import PropTypes from "prop-types";

import { Tracking } from "sajari";

import {
  Pipeline,
  Values,
  responseUpdatedEvent,
  valuesChangedEvent
} from "../../controllers";

const RIGHT_ARROW_KEYCODE = 39;
const TAB_KEYCODE = 9;
const RETURN_KEYCODE = 13;

class AutocompleteInput extends React.Component {
  /**
   * propTypes
   * @property {Values} values Values object.
   * @property {Pipeline} pipeline Pipeline object.
   * @property {Tracking} tracking Tracking object.
   * @property {string} [qParam="q"] Search parameter.
   * @property {string} [qOverrideParam="q.override"] Override parameter.
   * @property {boolean} [focus=false] Whether to focus the input element.
   */
  static get propTypes() {
    return {
      values: PropTypes.instanceOf(Values).isRequired,
      pipeline: PropTypes.instanceOf(Pipeline).isRequired,
      tracking: PropTypes.instanceOf(Tracking),
      qParam: PropTypes.string,
      qOverrideParam: PropTypes.string,
      focus: PropTypes.bool
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      ...this.getState(props.values, props.pipeline, props.qParam),
      qParam: props.qParam,
      qOverrideParam: props.qOverrideParam
    };
  }

  componentDidMount() {
    this.removeValuesListener = this.props.values.listen(
      valuesChangedEvent,
      this.valuesChanged
    );
    this.removeResponseListener = this.props.pipeline.listen(
      responseUpdatedEvent,
      this.valuesChanged
    );
  }

  componentWillUnmount() {
    this.removeValuesListener();
    this.removeResponseListener();
  }

  getState = (values, pipeline, qParam) => {
    const text = values.get()[qParam] || "";
    const responseValues = pipeline.getResponse().getValues();
    const completion =
      text && responseValues ? responseValues[qParam] || "" : "";
    return { text, completion };
  };

  valuesChanged = () => {
    this.setState(
      this.getState(this.props.values, this.props.pipeline, this.state.qParam)
    );
  };

  setText = (text, override = false) => {
    const textValues = {
      [this.state.qParam]: text,
      [this.state.qOverrideParam]: override ? "true" : undefined
    };
    this.props.values.set(textValues);
    if (textValues[this.state.qParam]) {
      this.props.pipeline.search(this.props.values, this.props.tracking);
    } else {
      this.props.pipeline.clearResponse();
    }
  };

  handleChange = e => {
    this.setText(e.target.value);
  };

  handleKeyDown = e => {
    const { text, completion } = this.state;
    if (e.keyCode === RETURN_KEYCODE) {
      e.preventDefault();
      this.setText(text, true);
    }
    if (!completion) {
      return;
    }
    if (
      e.keyCode === TAB_KEYCODE ||
      (e.keyCode === RIGHT_ARROW_KEYCODE &&
        e.target.selectionStart === text.length)
    ) {
      e.preventDefault();
      this.setText(completion);
    }
  };

  render() {
    const { text, completion } = this.state;
    const { placeHolder, focus } = this.props;

    return (
      <div className="sj-search-input-holder-outer">
        <div className="sj-search-input-holder-inner">
          <input
            type="text"
            className="sj-search-bar-completion sj-search-bar-input-common"
            value={completion.indexOf(text) === 0 ? completion : text}
            readOnly
          />
          <input
            type="text"
            className="sj-search-bar-input sj-search-bar-input-common"
            placeholder={placeHolder}
            autoFocus={focus}
            value={text}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
          />
        </div>
      </div>
    );
  }
}

AutocompleteInput.defaultProps = {
  qParam: "q",
  qOverrideParam: "q.override"
};

export default AutocompleteInput;
