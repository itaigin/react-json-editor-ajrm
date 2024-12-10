// @ts-nocheck
import React, { Component } from "react";
import themes from "./themes";
import { identical, getType } from "./mitsuketa";
import err from "./err";
import { format } from "./locale";
import defaultLocale from "./locale/en";
import { Colors, JSONInputProps, JSONInputState } from "./types";

class JSONInput extends Component<JSONInputProps, JSONInputState> {
  private mappedKeys = new Set();

  constructor(props: JSONInputProps) {
    super(props);
    this.updateInternalProps = this.updateInternalProps.bind(this);
    this.createMarkup = this.createMarkup.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.update = this.update.bind(this);
    this.getCursorPosition = this.getCursorPosition.bind(this);
    this.setCursorPosition = this.setCursorPosition.bind(this);
    this.scheduledUpdate = this.scheduledUpdate.bind(this);
    this.setUpdateTime = this.setUpdateTime.bind(this);
    this.renderLabels = this.renderLabels.bind(this);
    this.newSpan = this.newSpan.bind(this);
    this.renderErrorMessage = this.renderErrorMessage.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.showPlaceholder = this.showPlaceholder.bind(this);
    this.tokenize = this.tokenize.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPaste = this.onPaste.bind(this);
    this.stopEvent = this.stopEvent.bind(this);
    this.refContent = null;
    this.refLabels = null;
    this.updateInternalProps();
    this.renderCount = 1;
    this.state = {
      prevPlaceholder: "",
      markupText: "",
      plainText: "",
      json: "",
      jsObject: undefined,
      lines: 0,
      error: false,
      isLoading: false,
    };
    if (!this.props.locale) {
      console.warn(
        "[react-json-editor-ajrm - Deprecation Warning] You did not provide a 'locale' prop for your JSON input - This will be required in a future version. English has been set as a default.",
      );
    }
  }
  updateInternalProps() {
    let colors: Colors = {},
      style = {},
      theme: Colors = themes.dark_vscode_tribute;
    if ("theme" in this.props)
      if (typeof this.props.theme === "string")
        if (this.props.theme in themes) theme = themes[this.props.theme];
    colors = theme;
    if ("colors" in this.props)
      colors = {
        default:
          "default" in this.props.colors
            ? this.props.colors.default
            : colors.default,
        string:
          "string" in this.props.colors
            ? this.props.colors.string
            : colors.string,
        number:
          "number" in this.props.colors
            ? this.props.colors.number
            : colors.number,
        colon:
          "colon" in this.props.colors ? this.props.colors.colon : colors.colon,
        keys:
          "keys" in this.props.colors ? this.props.colors.keys : colors.keys,
        keys_whiteSpace:
          "keys_whiteSpace" in this.props.colors
            ? this.props.colors.keys_whiteSpace
            : colors.keys_whiteSpace,
        primitive:
          "primitive" in this.props.colors
            ? this.props.colors.primitive
            : colors.primitive,
        error:
          "error" in this.props.colors ? this.props.colors.error : colors.error,
        background:
          "background" in this.props.colors
            ? this.props.colors.background
            : colors.background,
        background_warning:
          "background_warning" in this.props.colors
            ? this.props.colors.background_warning
            : colors.background_warning,
      };
    this.colors = colors;
    if ("style" in this.props)
      style = {
        outerBox:
          "outerBox" in this.props.style ? this.props.style.outerBox : {},
        container:
          "container" in this.props.style ? this.props.style.container : {},
        warningBox:
          "warningBox" in this.props.style ? this.props.style.warningBox : {},
        errorMessage:
          "errorMessage" in this.props.style
            ? this.props.style.errorMessage
            : {},
        body: "body" in this.props.style ? this.props.style.body : {},
        labelColumn:
          "labelColumn" in this.props.style ? this.props.style.labelColumn : {},
        labels: "labels" in this.props.style ? this.props.style.labels : {},
        contentBox:
          "contentBox" in this.props.style ? this.props.style.contentBox : {},
      };
    else
      style = {
        outerBox: {},
        container: {},
        warningBox: {},
        errorMessage: {},
        body: {},
        labelColumn: {},
        labels: {},
        contentBox: {},
      };
    this.style = style;
    this.confirmGood =
      "confirmGood" in this.props ? this.props.confirmGood : true;
    const totalHeight = this.props.height || "610px",
      totalWidth = this.props.width || "479px";
    this.totalHeight = totalHeight;
    this.totalWidth = totalWidth;
    if (!("onKeyPressUpdate" in this.props) || this.props.onKeyPressUpdate) {
      if (!this.timer) this.timer = setInterval(this.scheduledUpdate, 100);
    } else if (this.timer) {
      clearInterval(this.timer);
      this.timer = false;
    }
    this.waitAfterKeyPress =
      "waitAfterKeyPress" in this.props ? this.props.waitAfterKeyPress : 1000;
    this.updateTime = false;
    this.resetConfiguration = "reset" in this.props ? this.props.reset : false;
  }
  render() {
    const id = this.props.id,
      markupText = this.state.markupText,
      error = this.props.error || this.state.error,
      colors = this.colors,
      style = this.style || {},
      confirmGood = this.confirmGood,
      totalHeight = this.totalHeight,
      totalWidth = this.totalWidth,
      isLoading = this.state.isLoading,
      hasError = !!this.props.error || (error ? "token" in error : false);
    this.renderCount++;
    return (
      <div
        id={id && id + "-outer-box"}
        style={{
          display: "block",
          overflow: "none",
          height: totalHeight,
          width: totalWidth,
          margin: 0,
          boxSizing: "border-box",
          position: "relative",
          ...style.outerBox,
        }}
      >
        {confirmGood ? (
          <div
            style={{
              opacity: hasError ? 0 : 1,
              height: "30px",
              width: "30px",
              position: "absolute",
              top: 0,
              right: 0,
              transform: "translate(-25%,25%)",
              pointerEvents: "none",
              transitionDuration: "0.2s",
              transitionTimingFunction: "cubic-bezier(0, 1, 0.5, 1)",
            }}
          >
              {isLoading
                  ? <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="30px" height="30px" viewBox="0 0 30 30" version="1.1">
                      <g id="surface1">
                          <path d="M 8.863281 15 C 8.863281 14.246094 8.253906 13.636719 7.5 13.636719 L 2.046875 13.636719 C 1.292969 13.636719 0.683594 14.246094 0.683594 15 C 0.683594 15.753906 1.292969 16.363281 2.046875 16.363281 L 7.5 16.363281 C 8.253906 16.363281 8.863281 15.753906 8.863281 15 Z M 8.863281 15 "/>
                          <path d="M 27.953125 13.636719 L 25.226562 13.636719 C 24.472656 13.636719 23.863281 14.246094 23.863281 15 C 23.863281 15.753906 24.472656 16.363281 25.226562 16.363281 L 27.953125 16.363281 C 28.707031 16.363281 29.316406 15.753906 29.316406 15 C 29.316406 14.246094 28.707031 13.636719 27.953125 13.636719 Z M 27.953125 13.636719 "/>
                          <path d="M 15.683594 8.183594 C 16.433594 8.183594 17.046875 7.570312 17.046875 6.816406 L 17.046875 1.363281 C 17.046875 0.609375 16.433594 0 15.683594 0 C 14.929688 0 14.316406 0.609375 14.316406 1.363281 L 14.316406 6.816406 C 14.316406 7.570312 14.929688 8.183594 15.683594 8.183594 Z M 15.683594 8.183594 "/>
                          <path d="M 15.683594 21.816406 C 14.929688 21.816406 14.316406 22.429688 14.316406 23.183594 L 14.316406 28.636719 C 14.316406 29.390625 14.929688 30 15.683594 30 C 16.433594 30 17.046875 29.390625 17.046875 28.636719 L 17.046875 23.183594 C 17.046875 22.429688 16.433594 21.816406 15.683594 21.816406 Z M 15.683594 21.816406 "/>
                          <path d="M 7.003906 4.394531 C 6.472656 3.859375 5.609375 3.859375 5.074219 4.394531 C 4.542969 4.925781 4.542969 5.789062 5.074219 6.320312 L 8.933594 10.179688 C 9.199219 10.445312 9.546875 10.578125 9.894531 10.578125 C 10.246094 10.578125 10.59375 10.445312 10.859375 10.179688 C 11.394531 9.644531 11.394531 8.78125 10.859375 8.25 Z M 7.003906 4.394531 "/>
                          <path d="M 22.429688 19.820312 C 21.898438 19.289062 21.035156 19.289062 20.503906 19.820312 C 19.96875 20.355469 19.96875 21.21875 20.503906 21.75 L 24.359375 25.605469 C 24.625 25.871094 24.976562 26.007812 25.324219 26.007812 C 25.671875 26.007812 26.023438 25.871094 26.289062 25.605469 C 26.820312 25.074219 26.820312 24.210938 26.289062 23.679688 Z M 22.429688 19.820312 "/>
                          <path d="M 8.933594 19.820312 L 5.074219 23.679688 C 4.542969 24.210938 4.542969 25.074219 5.074219 25.605469 C 5.339844 25.871094 5.691406 26.007812 6.039062 26.007812 C 6.386719 26.007812 6.738281 25.871094 7.003906 25.605469 L 10.859375 21.75 C 11.394531 21.21875 11.394531 20.355469 10.859375 19.820312 C 10.328125 19.289062 9.464844 19.289062 8.933594 19.820312 Z M 8.933594 19.820312 "/>
                      </g>
                  </svg>
                  : <svg height="30px" width="30px" viewBox="0 0 100 100">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        fill="green"
                        opacity="0.85"
                        d="M39.363,79L16,55.49l11.347-11.419L39.694,56.49L72.983,23L84,34.085L39.363,79z"
                      />
                  </svg>
              }
          </div>
        ) : (
          void 0
        )}
        <div
          id={id && id + "-container"}
          style={{
            display: "block",
            height: totalHeight,
            width: totalWidth,
            margin: 0,
            boxSizing: "border-box",
            overflow: "hidden",
            fontFamily: "Roboto, sans-serif",
            ...style.container,
          }}
          onClick={this.onClick}
        >
          <div
            id={id && id + "-warning-box"}
            style={{
              display: "block",
              overflow: "hidden",
              height: hasError ? "60px" : "0px",
              width: "100%",
              margin: 0,
              backgroundColor: colors.background_warning,
              transitionDuration: "0.2s",
              transitionTimingFunction: "cubic-bezier(0, 1, 0.5, 1)",
              ...style.warningBox,
            }}
            onClick={this.onClick}
          >
            <span
              style={{
                display: "inline-block",
                height: "60px",
                width: "60px",
                margin: 0,
                boxSizing: "border-box",
                overflow: "hidden",
                verticalAlign: "top",
                pointerEvents: "none",
              }}
              onClick={this.onClick}
            >
              <div
                style={{
                  position: "relative",
                  top: 0,
                  left: 0,
                  height: "60px",
                  width: "60px",
                  margin: 0,
                  pointerEvents: "none",
                }}
                onClick={this.onClick}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                  onClick={this.onClick}
                >
                  <svg height="25px" width="25px" viewBox="0 0 100 100">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      fill="red"
                      d="M73.9,5.75c0.467-0.467,1.067-0.7,1.8-0.7c0.7,0,1.283,0.233,1.75,0.7l16.8,16.8  c0.467,0.5,0.7,1.084,0.7,1.75c0,0.733-0.233,1.334-0.7,1.801L70.35,50l23.9,23.95c0.5,0.467,0.75,1.066,0.75,1.8  c0,0.667-0.25,1.25-0.75,1.75l-16.8,16.75c-0.534,0.467-1.117,0.7-1.75,0.7s-1.233-0.233-1.8-0.7L50,70.351L26.1,94.25  c-0.567,0.467-1.167,0.7-1.8,0.7c-0.667,0-1.283-0.233-1.85-0.7L5.75,77.5C5.25,77,5,76.417,5,75.75c0-0.733,0.25-1.333,0.75-1.8  L29.65,50L5.75,26.101C5.25,25.667,5,25.066,5,24.3c0-0.666,0.25-1.25,0.75-1.75l16.8-16.8c0.467-0.467,1.05-0.7,1.75-0.7  c0.733,0,1.333,0.233,1.8,0.7L50,29.65L73.9,5.75z"
                    />
                  </svg>
                </div>
              </div>
            </span>
            <span
              style={{
                display: "inline-block",
                height: "60px",
                width: "calc(100% - 60px)",
                margin: 0,
                overflow: "hidden",
                verticalAlign: "top",
                position: "absolute",
                pointerEvents: "none",
              }}
              onClick={this.onClick}
            >
              {this.renderErrorMessage()}
            </span>
          </div>
          <div
            id={id && id + "-body"}
            style={{
              display: "flex",
              overflow: "none",
              height: hasError ? "calc(100% - 60px)" : "100%",
              width: "",
              margin: 0,
              resize: "none",
              fontFamily: "Roboto Mono, Monaco, monospace",
              fontSize: "11px",
              backgroundColor: colors.background,
              transitionDuration: "0.2s",
              transitionTimingFunction: "cubic-bezier(0, 1, 0.5, 1)",
              ...style.body,
            }}
            onClick={this.onClick}
          >
            <span
              id={id && id + "-labels"}
              ref={(ref) => (this.refLabels = ref)}
              style={{
                display: "inline-block",
                boxSizing: "border-box",
                verticalAlign: "top",
                height: "100%",
                width: "44px",
                margin: 0,
                padding: "5px 0px 5px 10px",
                overflow: "hidden",
                color: "#D4D4D4",
                ...style.labelColumn,
              }}
              onClick={this.onClick}
            >
              {this.renderLabels()}
            </span>
            <span
              id={id}
              ref={(ref) => (this.refContent = ref)}
              contentEditable={true}
              style={{
                display: "inline-block",
                boxSizing: "border-box",
                verticalAlign: "top",
                height: "100%",
                width: "",
                flex: 1,
                margin: 0,
                padding: "5px",
                overflowX: "hidden",
                overflowY: "auto",
                wordWrap: "break-word",
                whiteSpace: "pre-line",
                color: "#D4D4D4",
                outline: "none",
                ...style.contentBox,
              }}
              dangerouslySetInnerHTML={this.createMarkup(markupText)}
              onKeyPress={this.onKeyPress}
              onKeyDown={this.onKeyDown}
              onClick={this.onClick}
              onBlur={this.onBlur}
              onScroll={this.onScroll}
              onPaste={this.onPaste}
              // @ts-ignore
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    );
  }
  renderErrorMessage() {
    const locale = this.props.locale || defaultLocale,
      error = this.props.error || this.state.error,
      style = this.style;
    if (!error) return void 0;
    return (
      <p
        style={{
          color: "red",
          fontSize: "12px",
          position: "absolute",
          width: "calc(100% - 60px)",
          height: "60px",
          boxSizing: "border-box",
          margin: 0,
          padding: 0,
          paddingRight: "10px",
          overflowWrap: "break-word",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          ...style.errorMessage,
        }}
      >
        {format(locale.format, error)}
      </p>
    );
  }
  renderLabels() {
    const colors = this.colors,
      style = this.style,
      error = this.props.error || this.state.error,
      errorLine = error ? error.line : -1,
      lines = this.state.lines ? this.state.lines : 1;
    let labels = new Array(lines);
    for (let i = 0; i < lines - 1; i++) labels[i] = i + 1;
    return labels.map((number) => {
      const color = number !== errorLine ? colors.default : "red";
      return (
        <div
          key={number}
          style={{
            ...style.labels,
            color: color,
          }}
        >
          {number}
        </div>
      );
    });
  }
  createMarkup(markupText: any) {
    if (markupText === undefined) return { __html: "" };
    return { __html: "" + markupText };
  }
  newSpan(i: number, token: any, depth: any) {
    let colors = this.colors,
      type = token.type,
      string = token.string;
    let color = "";
    switch (type) {
      case "string":
      case "number":
      case "primitive":
      case "error":
        color = colors[token.type];
        break;
      case "key":
        if (string === " ") color = colors.keys_whiteSpace;
        else color = colors.keys;
        break;
      case "symbol":
        if (string === ":") color = colors.colon;
        else color = colors.default;
        break;
      default:
        color = colors.default;
        break;
    }
    if (string.length !== string.replace(/</g, "").replace(/>/g, "").length)
      string = "<xmp style=display:inline;>" + string + "</xmp>";
    return (
      "<span" +
      ' type="' +
      type +
      '"' +
      ' value="' +
      string +
      '"' +
      ' depth="' +
      depth +
      '"' +
      ' style="color:' +
      color +
      '"' +
      ">" +
      string +
      "</span>"
    );
  }
  getCursorPosition(countBR: boolean) {
    /**
     * Need to deprecate countBR
     * It is used to differenciate between good markup render, and aux render when error found
     * Adjustments based on coundBR account for usage of <br> instead of <span> for linebreaks to determine acurate cursor position
     * Find a way to consolidate render styles
     */
    const isChildOf = (node: any) => {
      while (node !== null) {
        if (node === this.refContent) return true;
        node = node.parentNode;
      }
      return false;
    };
    let selection: any = window.getSelection(),
      charCount = -1,
      linebreakCount = 0,
      node;
    if (selection.focusNode && isChildOf(selection.focusNode)) {
      node = selection.focusNode;
      charCount = selection.focusOffset;
      while (node) {
        if (node === this.refContent) break;
        if (node.previousSibling) {
          node = node.previousSibling;
          if (countBR) if (node.nodeName === "BR") linebreakCount++;
          charCount += node.textContent.length;
        } else {
          node = node.parentNode;
          if (node === null) break;
        }
      }
    }
    return charCount + linebreakCount;
  }
  setCursorPosition(nextPosition: any) {
    if ([false, null, undefined].indexOf(nextPosition) > -1) return;
    const createRange = (node: any, chars: any, range?: any) => {
      if (!range) {
        range = document.createRange();
        range.selectNode(node);
        range.setStart(node, 0);
      }
      if (chars.count === 0) {
        range.setEnd(node, chars.count);
      } else if (node && chars.count > 0) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.length < chars.count)
            chars.count -= node.textContent.length;
          else {
            range.setEnd(node, chars.count);
            chars.count = 0;
          }
        } else
          for (let lp = 0; lp < node.childNodes.length; lp++) {
            range = createRange(node.childNodes[lp], chars, range);
            if (chars.count === 0) break;
          }
      }
      return range;
    };
    const setPosition = (chars: any) => {
      if (chars < 0) return;
      let selection = window.getSelection(),
        range = createRange(this.refContent, { count: chars });
      if (!range) return;
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    };
    if (nextPosition > 0) setPosition(nextPosition);
    else this.refContent.focus();
  }
  update(cursorOffset = 0, updateCursorPosition = true) {
    const container = this.refContent,
      data = this.tokenize(container);
    if ("onChange" in this.props) {
      const jsObject = this.decodePlaceholder(data.jsObject);
      this.props.onChange({
          plainText: data.indented,
          markupText: data.markup,
          json: data.json,
          jsObject,
          lines: data.lines,
          error: data.error,
      });
    }
    let cursorPosition = this.getCursorPosition(data.error) + cursorOffset;
    this.updateTime = false;
    this.setState({
      plainText: data.indented,
      markupText: data.markup,
      json: data.json,
      jsObject: data.jsObject,
      lines: data.lines,
      error: data.error,
      isLoading: false,
    });
    if (updateCursorPosition) this.setCursorPosition(cursorPosition);
  }
  scheduledUpdate() {
    if ("onKeyPressUpdate" in this.props)
      if (this.props.onKeyPressUpdate === false) return;
    const { updateTime } = this;
    if (updateTime === false || updateTime > new Date().getTime()) {
        return;
    }
    this.update();
  }
  setUpdateTime() {
    if ("onKeyPressUpdate" in this.props)
      if (this.props.onKeyPressUpdate === false) return;
    this.updateTime = new Date().getTime() + this.waitAfterKeyPress;
    this.setState({ isLoading: true });
  }
  stopEvent(event: any) {
    if (!event) return;
    event.preventDefault();
    event.stopPropagation();
  }
  onKeyPress(event: any) {
    const ctrlOrMetaIsPressed = event.ctrlKey || event.metaKey;
    if (this.props.viewOnly && !ctrlOrMetaIsPressed) this.stopEvent(event);
    if (!ctrlOrMetaIsPressed) this.setUpdateTime();
  }
  onKeyDown(event: any) {
    const viewOnly = !!this.props.viewOnly;
    const ctrlOrMetaIsPressed = event.ctrlKey || event.metaKey;

    switch (event.key) {
      case "Tab":
        this.stopEvent(event);
        if (viewOnly) break;
        document.execCommand("insertText", false, "  ");
        this.setUpdateTime();
        break;
      case "Backspace":
      case "Delete":
        if (viewOnly) this.stopEvent(event);
        this.setUpdateTime();
        break;
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
        this.setUpdateTime();
        break;
      case "a":
      case "c":
        if (viewOnly && !ctrlOrMetaIsPressed) this.stopEvent(event);
        break;
      default:
        if (viewOnly) this.stopEvent(event);
        break;
    }
  }
  onPaste(event: any) {
    if (this.props.viewOnly) {
      this.stopEvent(event);
    } else {
      event.preventDefault();
      let text = event.clipboardData.getData("text/plain")?.replace(/(\r\n|\n|\r|\t|\u200B)/gm, '');
      document.execCommand("insertText", false, text);
    }
    this.update();
  }
  onClick() {
    if ("viewOnly" in this.props) if (this.props.viewOnly) return;
  }
  onBlur() {
    if ("viewOnly" in this.props) if (this.props.viewOnly) return;
    const container = this.refContent,
      data = this.tokenize(container);
    if ("onBlur" in this.props) {
      const jsObject = this.decodePlaceholder(data.jsObject)
      this.props.onBlur({
        plainText: data.indented,
        markupText: data.markup,
        json: data.json,
        jsObject,
        lines: data.lines,
        error: data.error,
      });
    }
  }
  onScroll(event) {
    this.refLabels.scrollTop = event.target.scrollTop;
  }
  componentDidUpdate() {
    if (!this.state.isLoading) {
        this.updateInternalProps();
        this.showPlaceholder();
    }
  }
  componentDidMount() {
    this.showPlaceholder();
  }
  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
    this.mappedKeys.clear();
  }

  private isArray(value) {
      return Array.isArray(value);
  }

  private isObject(value) {
      return typeof value === 'object' && !this.isArray(value) && value !== null
  }

  private isString(value) {
      return typeof value === 'string' || value instanceof String;
  }

  private encodePlaceholder(placeholder) {
      try {
          if (!this.isObject(placeholder)) return;
          for (const [key, value] of Object.entries(placeholder)) {
              const isArray = this.isArray(value);
              if (!this.isString(value) && !isArray) continue;
              if (isArray) {
                  value.forEach((val, index) => {
                      try {
                          placeholder[key][index] = JSON.parse(val);
                          this.mappedKeys.add({ key, type: "array" });
                      } catch (e) {
                          placeholder[key][index] = val;
                      }
                  })
              } else {
                  try {
                      placeholder[key] = JSON.parse(value);
                      this.mappedKeys.add({ key });
                  } catch (e) {
                      placeholder[key] = value;
                  }
              }
          }
      } catch (e) {
          console.error(e);
      }
  }

  private decodePlaceholder(placeholder) {
      if (!placeholder) return null;
      const decodedPlaceholder = structuredClone(placeholder);
      Array.from(this.mappedKeys).forEach(item => {
          const value = placeholder[item.key];
          if (item.type === "array") {
              value.forEach((val, index) => {
                  try {
                      decodedPlaceholder[item.key][index] = JSON.stringify(val);
                  } catch (e) {
                      decodedPlaceholder[item.key][index] = val;
                  }
              })
          } else {
              try {
                  decodedPlaceholder[item.key] = JSON.stringify(value);
              } catch (e) {
                  console.error(e);
              }
          }
      });
      return decodedPlaceholder;
  }

  showPlaceholder() {
    const placeholderDoesNotExist = !("placeholder" in this.props);
    if (placeholderDoesNotExist) return;

    const { placeholder } = this.props;

    const placeholderHasEmptyValues =
      [undefined, null].indexOf(placeholder) > -1;
    if (placeholderHasEmptyValues) return;

    this.encodePlaceholder(placeholder);

    const { prevPlaceholder, jsObject } = this.state;
    const { resetConfiguration } = this;

    const placeholderDataType = getType(placeholder);
    const unexpectedDataType =
      ["object", "array"].indexOf(placeholderDataType) === -1;
    if (unexpectedDataType)
      err.throwError(
        "showPlaceholder",
        "placeholder",
        "either an object or an array",
      );

    const samePlaceholderValues = identical(placeholder, prevPlaceholder);

    // Component will always re-render when new placeholder value is any different from previous placeholder value.
    let componentShouldUpdate = !samePlaceholderValues;

    if (!componentShouldUpdate) {
      if (resetConfiguration) {
        /**
         * If 'reset' property is set true or is truthy,
         * any difference between placeholder and current value
         * should trigger component re-render
         */
        if (jsObject !== undefined)
          componentShouldUpdate = !identical(placeholder, jsObject);
      }
    }

    if (!componentShouldUpdate) return;

    const data: any = this.tokenize(placeholder);
    this.setState({
      prevPlaceholder: placeholder,
      plainText: data.indentation,
      markupText: data.markup,
      lines: data.lines,
      error: data.error,
      isLoading: false,
    });
  }
  tokenize(something: any) {
    if (typeof something !== "object")
      return console.error(
        "tokenize() expects object type properties only. Got '" +
          typeof something +
          "' type instead.",
      );
    const locale = this.props.locale || defaultLocale;
    const newSpan = this.newSpan;

    /**
     *     DOM NODE || ONBLUR OR UPDATE
     */

    if ("nodeType" in something) {
      const containerNode = something.cloneNode(true),
        hasChildren = containerNode.hasChildNodes();
      if (!hasChildren) return "";
      const children = containerNode.childNodes;

      let buffer: any = {
        tokens_unknown: [],
        tokens_proto: [],
        tokens_split: [],
        tokens_fallback: [],
        tokens_normalize: [],
        tokens_merge: [],
        tokens_plainText: "",
        indented: "",
        json: "",
        jsObject: undefined,
        markup: "",
      };
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        let info = {};
        switch (child.nodeName) {
          case "SPAN":
            info = {
              string: child.textContent,
              type: child.attributes.type.textContent,
            };
            buffer.tokens_unknown.push(info);
            break;
          case "DIV":
            buffer.tokens_unknown.push({
              string: child.textContent,
              type: "unknown",
            });
            break;
          case "BR":
            if (child.textContent === "")
              buffer.tokens_unknown.push({ string: "\n", type: "unknown" });
            break;
          case "#text":
            buffer.tokens_unknown.push({
              string: child.textContent,
              type: "unknown",
            });
            break;
          case "FONT":
            buffer.tokens_unknown.push({
              string: child.textContent,
              type: "unknown",
            });
            break;
          default:
            console.error("Unrecognized node:", { child });
            break;
        }
      }
      function quarkize(text: any, prefix = "") {
        let buffer: any = {
          active: false,
          string: "",
          number: "",
          symbol: "",
          space: "",
          delimiter: "",
          quarks: [],
        };
        function pushAndStore(char: any, type: any) {
          switch (type) {
            case "symbol":
            case "delimiter":
              if (buffer.active)
                buffer.quarks.push({
                  string: buffer[buffer.active],
                  type: prefix + "-" + buffer.active,
                });
              buffer[buffer.active] = "";
              buffer.active = type;
              buffer[buffer.active] = char;
              break;
            default:
              if (
                type !== buffer.active ||
                [buffer.string, char].indexOf("\n") > -1
              ) {
                if (buffer.active)
                  buffer.quarks.push({
                    string: buffer[buffer.active],
                    type: prefix + "-" + buffer.active,
                  });
                buffer[buffer.active] = "";
                buffer.active = type;
                buffer[buffer.active] = char;
              } else buffer[type] += char;
              break;
          }
        }
        function finalPush() {
          if (buffer.active) {
            buffer.quarks.push({
              string: buffer[buffer.active],
              type: prefix + "-" + buffer.active,
            });
            buffer[buffer.active] = "";
            buffer.active = false;
          }
        }
        for (let i = 0; i < text.length; i++) {
          const char = text.charAt(i);
          switch (char) {
            case '"':
            case "'":
              pushAndStore(char, "delimiter");
              break;
            case " ":
            case "\u00A0":
              pushAndStore(char, "space");
              break;
            case "{":
            case "}":
            case "[":
            case "]":
            case ":":
            case ",":
              pushAndStore(char, "symbol");
              break;
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
              if (buffer.active === "string") pushAndStore(char, "string");
              else pushAndStore(char, "number");
              break;
            case "-":
              if (i < text.length - 1)
                if ("0123456789".indexOf(text.charAt(i + 1)) > -1) {
                  pushAndStore(char, "number");
                  break;
                }
            case ".":
              if (i < text.length - 1 && i > 0)
                if (
                  "0123456789".indexOf(text.charAt(i + 1)) > -1 &&
                  "0123456789".indexOf(text.charAt(i - 1)) > -1
                ) {
                  pushAndStore(char, "number");
                  break;
                }
            default:
              pushAndStore(char, "string");
              break;
          }
        }
        finalPush();
        return buffer.quarks;
      }
      for (let i = 0; i < buffer.tokens_unknown.length; i++) {
        let token = buffer.tokens_unknown[i];
        buffer.tokens_proto = buffer.tokens_proto.concat(
          quarkize(token.string, "proto"),
        );
      }
      function validToken(string: any, type: any) {
        const quotes = "'\"";
        let firstChar = "",
          lastChar = "",
          quoteType: any = false;
        switch (type) {
          case "primitive":
            if (["true", "false", "null", "undefined"].indexOf(string) === -1)
              return false;
            break;
          case "string":
            if (string.length < 2) return false;
            (firstChar = string.charAt(0)),
              (lastChar = string.charAt(string.length - 1)),
              (quoteType = quotes.indexOf(firstChar));
            if (quoteType === -1) return false;
            if (firstChar !== lastChar) return false;
            for (let i = 0; i < string.length; i++) {
              if (i > 0 && i < string.length - 1)
                if (string.charAt(i) === quotes[quoteType])
                  if (string.charAt(i - 1) !== "\\") return false;
            }
            break;
          case "key":
            if (string.length === 0) return false;
            (firstChar = string.charAt(0)),
              (lastChar = string.charAt(string.length - 1)),
              (quoteType = quotes.indexOf(firstChar));
            if (quoteType > -1) {
              if (string.length === 1) return false;
              if (firstChar !== lastChar) return false;
              for (let i = 0; i < string.length; i++) {
                if (i > 0 && i < string.length - 1)
                  if (string.charAt(i) === quotes[quoteType])
                    if (string.charAt(i - 1) !== "\\") return false;
              }
            } else {
              const nonAlphanumeric = "'\"`.,:;{}[]&<>=~*%\\|/-+!?@^ \xa0";
              for (let i = 0; i < nonAlphanumeric.length; i++) {
                const nonAlpha = nonAlphanumeric.charAt(i);
                if (string.indexOf(nonAlpha) > -1) return false;
              }
            }
            break;
          case "number":
            for (let i = 0; i < string.length; i++) {
              if ("0123456789".indexOf(string.charAt(i)) === -1)
                if (i === 0) {
                  if ("-" !== string.charAt(0)) return false;
                } else if ("." !== string.charAt(i)) return false;
            }
            break;
          case "symbol":
            if (string.length > 1) return false;
            if ("{[:]},".indexOf(string) === -1) return false;
            break;
          case "colon":
            if (string.length > 1) return false;
            if (":" !== string) return false;
            break;
          default:
            return true;
            break;
        }
        return true;
      }
      for (let i = 0; i < buffer.tokens_proto.length; i++) {
        let token = buffer.tokens_proto[i];
        if (token.type.indexOf("proto") === -1) {
          if (!validToken(token.string, token.type)) {
            buffer.tokens_split = buffer.tokens_split.concat(
              quarkize(token.string, "split"),
            );
          } else buffer.tokens_split.push(token);
        } else buffer.tokens_split.push(token);
      }
      for (let i = 0; i < buffer.tokens_split.length; i++) {
        let token = buffer.tokens_split[i];
        let type = token.type,
          string = token.string,
          length = string.length,
          fallback = [];
        if (type.indexOf("-") > -1) {
          type = type.slice(type.indexOf("-") + 1);
          if (type !== "string") fallback.push("string");
          fallback.push("key");
          fallback.push("error");
        }
        let tokul = {
          string: string,
          length: length,
          type: type,
          fallback: fallback,
        };
        buffer.tokens_fallback.push(tokul);
      }
      function tokenFollowed() {
        const last = buffer.tokens_normalize.length - 1;
        if (last < 1) return false;
        for (let i = last; i >= 0; i--) {
          const previousToken = buffer.tokens_normalize[i];
          switch (previousToken.type) {
            case "space":
            case "linebreak":
              break;
            default:
              return previousToken;
              break;
          }
        }
        return false;
      }
      let buffer2: any = {
        brackets: [],
        stringOpen: false,
        isValue: false,
      };
      for (let i = 0; i < buffer.tokens_fallback.length; i++) {
        let token = buffer.tokens_fallback[i];
        const type = token.type,
          string = token.string;
        let normalToken = {
          type: type,
          string: string,
        };
        switch (type) {
          case "symbol":
          case "colon":
            if (buffer2.stringOpen) {
              if (buffer2.isValue) normalToken.type = "string";
              else normalToken.type = "key";
              break;
            }
            switch (string) {
              case "[":
              case "{":
                buffer2.brackets.push(string);
                buffer2.isValue =
                  buffer2.brackets[buffer2.brackets.length - 1] === "[";
                break;
              case "]":
              case "}":
                buffer2.brackets.pop();
                buffer2.isValue =
                  buffer2.brackets[buffer2.brackets.length - 1] === "[";
                break;
              case ",":
                if (tokenFollowed().type === "colon") break;
                buffer2.isValue =
                  buffer2.brackets[buffer2.brackets.length - 1] === "[";
                break;
              case ":":
                normalToken.type = "colon";
                buffer2.isValue = true;
                break;
            }
            break;
          case "delimiter":
            if (buffer2.isValue) normalToken.type = "string";
            else normalToken.type = "key";
            if (!buffer2.stringOpen) {
              buffer2.stringOpen = string;
              break;
            }
            if (i > 0) {
              const previousToken = buffer.tokens_fallback[i - 1],
                _string = previousToken.string,
                _type = previousToken.type,
                _char = _string.charAt(_string.length - 1);
              if (_type === "string" && _char === "\\") break;
            }
            if (buffer2.stringOpen === string) {
              buffer2.stringOpen = false;
              break;
            }
            break;
          case "primitive":
          case "string":
            if (["false", "true", "null", "undefined"].indexOf(string) > -1) {
              const lastIndex = buffer.tokens_normalize.length - 1;
              if (lastIndex >= 0) {
                if (buffer.tokens_normalize[lastIndex].type !== "string") {
                  normalToken.type = "primitive";
                  break;
                }
                normalToken.type = "string";
                break;
              }
              normalToken.type = "primitive";
              break;
            }
            if (string === "\n")
              if (!buffer2.stringOpen) {
                normalToken.type = "linebreak";
                break;
              }
            if (buffer2.isValue) normalToken.type = "string";
            else normalToken.type = "key";
            break;
          case "space":
            if (buffer2.stringOpen)
              if (buffer2.isValue) normalToken.type = "string";
              else normalToken.type = "key";
            break;
          case "number":
            if (buffer2.stringOpen)
              if (buffer2.isValue) normalToken.type = "string";
              else normalToken.type = "key";
            break;
          default:
            break;
        }
        buffer.tokens_normalize.push(normalToken);
      }
      for (let i = 0; i < buffer.tokens_normalize.length; i++) {
        const token = buffer.tokens_normalize[i];
        let mergedToken = {
          string: token.string,
          type: token.type,
          tokens: [i],
        };
        if (["symbol", "colon"].indexOf(token.type) === -1)
          if (i + 1 < buffer.tokens_normalize.length) {
            let count = 0;
            for (let u = i + 1; u < buffer.tokens_normalize.length; u++) {
              const nextToken = buffer.tokens_normalize[u];
              if (token.type !== nextToken.type) break;
              mergedToken.string += nextToken.string;
              mergedToken.tokens.push(u);
              count++;
            }
            i += count;
          }
        buffer.tokens_merge.push(mergedToken);
      }
      const quotes = "'\"",
        alphanumeric =
          "abcdefghijklmnopqrstuvwxyz" +
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
          "0123456789" +
          "_$";
      let error: any = false,
        line = buffer.tokens_merge.length > 0 ? 1 : 0;
      buffer2 = {
        brackets: [],
        stringOpen: false,
        isValue: false,
      };
      function setError(tokenID: any, reason: any, offset = 0) {
        error = {
          token: tokenID,
          line: line,
          reason: reason,
        };
        buffer.tokens_merge[tokenID + offset].type = "error";
      }
      function followedBySymbol(tokenID: any, options: any) {
        if (tokenID === undefined)
          console.error("tokenID argument must be an integer.");
        if (options === undefined)
          console.error("options argument must be an array.");
        if (tokenID === buffer.tokens_merge.length - 1) return false;
        for (let i = tokenID + 1; i < buffer.tokens_merge.length; i++) {
          const nextToken = buffer.tokens_merge[i];
          switch (nextToken.type) {
            case "space":
            case "linebreak":
              break;
            case "symbol":
            case "colon":
              if (options.indexOf(nextToken.string) > -1) return i;
              else return false;
              break;
            default:
              return false;
              break;
          }
        }
        return false;
      }
      function followsSymbol(tokenID: any, options: any) {
        if (tokenID === undefined)
          console.error("tokenID argument must be an integer.");
        if (options === undefined)
          console.error("options argument must be an array.");
        if (tokenID === 0) return false;
        for (let i = tokenID - 1; i >= 0; i--) {
          const previousToken = buffer.tokens_merge[i];
          switch (previousToken.type) {
            case "space":
            case "linebreak":
              break;
            case "symbol":
            case "colon":
              if (options.indexOf(previousToken.string) > -1) return true;
              return false;
              break;
            default:
              return false;
              break;
          }
        }
        return false;
      }
      function typeFollowed(tokenID: any) {
        if (tokenID === undefined)
          console.error("tokenID argument must be an integer.");
        if (tokenID === 0) return false;
        for (let i = tokenID - 1; i >= 0; i--) {
          const previousToken = buffer.tokens_merge[i];
          switch (previousToken.type) {
            case "space":
            case "linebreak":
              break;
            default:
              return previousToken.type;
              break;
          }
        }
        return false;
      }
      let bracketList: any = [];
      for (let i = 0; i < buffer.tokens_merge.length; i++) {
        if (error) break;
        let token = buffer.tokens_merge[i],
          string = token.string,
          type = token.type,
          found: any = false;

        switch (type) {
          case "space":
            break;
          case "linebreak":
            line++;
            break;
          case "symbol":
            switch (string) {
              case "{":
              case "[":
                found = followsSymbol(i, ["}", "]"]);
                if (found) {
                  setError(
                    i,
                    format(locale.invalidToken.tokenSequence.prohibited, {
                      firstToken: buffer.tokens_merge?.[string]?.string,
                      secondToken: string,
                    }),
                  );
                  break;
                }
                if (string === "[" && i > 0)
                  if (!followsSymbol(i, [":", "[", ","])) {
                    setError(
                      i,
                      format(locale.invalidToken.tokenSequence.permitted, {
                        firstToken: "[",
                        secondToken: [":", "[", ","],
                      }),
                    );
                    break;
                  }
                if (string === "{")
                  if (followsSymbol(i, ["{"])) {
                    setError(
                      i,
                      format(locale.invalidToken.double, {
                        token: "{",
                      }),
                    );
                    break;
                  }
                buffer2.brackets.push(string);
                buffer2.isValue =
                  buffer2.brackets[buffer2.brackets.length - 1] === "[";
                bracketList.push({ i: i, line: line, string: string });
                break;
              case "}":
              case "]":
                if (string === "}")
                  if (buffer2.brackets[buffer2.brackets.length - 1] !== "{") {
                    setError(i, format(locale.brace.curly.missingOpen));
                    break;
                  }
                if (string === "}")
                  if (followsSymbol(i, [","])) {
                    setError(
                      i,
                      format(locale.invalidToken.tokenSequence.prohibited, {
                        firstToken: ",",
                        secondToken: "}",
                      }),
                    );
                    break;
                  }
                if (string === "]")
                  if (buffer2.brackets[buffer2.brackets.length - 1] !== "[") {
                    setError(i, format(locale.brace.square.missingOpen));
                    break;
                  }
                if (string === "]")
                  if (followsSymbol(i, [":"])) {
                    setError(
                      i,
                      format(locale.invalidToken.tokenSequence.prohibited, {
                        firstToken: ":",
                        secondToken: "]",
                      }),
                    );
                    break;
                  }
                buffer2.brackets.pop();
                buffer2.isValue =
                  buffer2.brackets[buffer2.brackets.length - 1] === "[";
                bracketList.push({ i: i, line: line, string: string });
                break;
              case ",":
                found = followsSymbol(i, ["{"]);
                if (found) {
                  if (followedBySymbol(i, ["}"])) {
                    setError(
                      i,
                      format(locale.brace.curly.cannotWrap, {
                        token: ",",
                      }),
                    );
                    break;
                  }
                  setError(
                    i,
                    format(locale.invalidToken.tokenSequence.prohibited, {
                      firstToken: "{",
                      secondToken: ",",
                    }),
                  );
                  break;
                }
                if (followedBySymbol(i, ["}", ",", "]"])) {
                  setError(i, format(locale.noTrailingOrLeadingComma));
                  break;
                }
                found = typeFollowed(i);
                switch (found) {
                  case "key":
                  case "colon":
                    setError(
                      i,
                      format(locale.invalidToken.termSequence.prohibited, {
                        firstTerm:
                          found === "key"
                            ? locale.types.key
                            : locale.symbols.colon,
                        secondTerm: locale.symbols.comma,
                      }),
                    );
                    break;
                  case "symbol":
                    if (followsSymbol(i, ["{"])) {
                      setError(
                        i,
                        format(locale.invalidToken.tokenSequence.prohibited, {
                          firstToken: "{",
                          secondToken: ",",
                        }),
                      );
                      break;
                    }
                    break;
                  default:
                    break;
                }
                buffer2.isValue =
                  buffer2.brackets[buffer2.brackets.length - 1] === "[";
                break;
              default:
                break;
            }
            buffer.json += string;
            break;
          case "colon":
            found = followsSymbol(i, ["["]);
            if (found && followedBySymbol(i, ["]"])) {
              setError(
                i,
                format(locale.brace.square.cannotWrap, {
                  token: ":",
                }),
              );
              break;
            }
            if (found) {
              setError(
                i,
                format(locale.invalidToken.tokenSequence.prohibited, {
                  firstToken: "[",
                  secondToken: ":",
                }),
              );
              break;
            }
            if (typeFollowed(i) !== "key") {
              setError(
                i,
                format(locale.invalidToken.termSequence.permitted, {
                  firstTerm: locale.symbols.colon,
                  secondTerm: locale.types.key,
                }),
              );
              break;
            }
            if (followedBySymbol(i, ["}", "]"])) {
              setError(
                i,
                format(locale.invalidToken.termSequence.permitted, {
                  firstTerm: locale.symbols.colon,
                  secondTerm: locale.types.value,
                }),
              );
              break;
            }
            buffer2.isValue = true;
            buffer.json += string;
            break;
          case "key":
          case "string":
            let firstChar = string.charAt(0),
              lastChar = string.charAt(string.length - 1),
              quote_primary = quotes.indexOf(firstChar);
            if (quotes.indexOf(firstChar) === -1)
              if (quotes.indexOf(lastChar) !== -1) {
                setError(
                  i,
                  format(locale.string.missingOpen, {
                    quote: firstChar,
                  }),
                );
                break;
              }
            if (quotes.indexOf(lastChar) === -1)
              if (quotes.indexOf(firstChar) !== -1) {
                setError(
                  i,
                  format(locale.string.missingClose, {
                    quote: firstChar,
                  }),
                );
                break;
              }
            if (quotes.indexOf(firstChar) > -1)
              if (firstChar !== lastChar) {
                setError(
                  i,
                  format(locale.string.missingClose, {
                    quote: firstChar,
                  }),
                );
                break;
              }
            if ("string" === type)
              if (
                quotes.indexOf(firstChar) === -1 &&
                quotes.indexOf(lastChar) === -1
              ) {
                setError(i, format(locale.string.mustBeWrappedByQuotes));
                break;
              }
            if ("key" === type)
              if (followedBySymbol(i, ["}", "]"])) {
                setError(
                  i,
                  format(locale.invalidToken.termSequence.permitted, {
                    firstTerm: locale.types.key,
                    secondTerm: locale.symbols.colon,
                  }),
                );
              }
            if (
              quotes.indexOf(firstChar) === -1 &&
              quotes.indexOf(lastChar) === -1
            )
              for (let h = 0; h < string.length; h++) {
                if (error) break;
                const c = string.charAt(h);
                if (alphanumeric.indexOf(c) === -1) {
                  setError(
                    i,
                    format(locale.string.nonAlphanumeric, {
                      token: c,
                    }),
                  );
                  break;
                }
              }
            if (firstChar === "'") string = '"' + string.slice(1, -1) + '"';
            else if (firstChar !== '"') string = '"' + string + '"';
            if ("key" === type)
              if ("key" === typeFollowed(i)) {
                if (i > 0)
                  if (!isNaN(buffer.tokens_merge[i - 1])) {
                    buffer.tokens_merge[i - 1] += buffer.tokens_merge[i];
                    setError(
                      i,
                      format(locale.key.numberAndLetterMissingQuotes),
                    );
                    break;
                  }
                setError(i, format(locale.key.spaceMissingQuotes));
                break;
              }
            if ("key" === type)
              if (!followsSymbol(i, ["{", ","])) {
                setError(
                  i,
                  format(locale.invalidToken.tokenSequence.permitted, {
                    firstToken: type,
                    secondToken: ["{", ","],
                  }),
                );
                break;
              }
            if ("string" === type)
              if (!followsSymbol(i, ["[", ":", ","])) {
                setError(
                  i,
                  format(locale.invalidToken.tokenSequence.permitted, {
                    firstToken: type,
                    secondToken: ["[", ":", ","],
                  }),
                );
                break;
              }
            if ("key" === type)
              if (buffer2.isValue) {
                setError(i, format(locale.string.unexpectedKey));
                break;
              }
            if ("string" === type)
              if (!buffer2.isValue) {
                setError(i, format(locale.key.unexpectedString));
                break;
              }
            buffer.json += string;
            break;
          case "number":
          case "primitive":
            if (followsSymbol(i, ["{"])) {
              buffer.tokens_merge[i].type = "key";
              type = buffer.tokens_merge[i].type;
              string = '"' + string + '"';
            } else if (typeFollowed(i) === "key") {
              buffer.tokens_merge[i].type = "key";
              type = buffer.tokens_merge[i].type;
            } else if (!followsSymbol(i, ["[", ":", ","])) {
              setError(
                i,
                format(locale.invalidToken.tokenSequence.permitted, {
                  firstToken: type,
                  secondToken: ["[", ":", ","],
                }),
              );
              break;
            }
            if (type !== "key")
              if (!buffer2.isValue) {
                buffer.tokens_merge[i].type = "key";
                type = buffer.tokens_merge[i].type;
                string = '"' + string + '"';
              }
            if (type === "primitive")
              if (string === "undefined")
                setError(
                  i,
                  format(locale.invalidToken.useInstead, {
                    badToken: "undefined",
                    goodToken: "null",
                  }),
                );
            buffer.json += string;
            break;
        }
      }
      let noEscapedSingleQuote = "";
      for (let i = 0; i < buffer.json.length; i++) {
        let current = buffer.json.charAt(i),
          next = "";
        if (i + 1 < buffer.json.length) {
          next = buffer.json.charAt(i + 1);
          if (current === "\\" && next === "'") {
            noEscapedSingleQuote += next;
            i++;
            continue;
          }
        }
        noEscapedSingleQuote += current;
      }
      buffer.json = noEscapedSingleQuote;
      if (!error) {
        const maxIterations = Math.ceil(bracketList.length / 2);
        let round = 0,
          delta = false;
        function removePair(index: any) {
          bracketList.splice(index + 1, 1);
          bracketList.splice(index, 1);
          if (!delta) delta = true;
        }
        while (bracketList.length > 0) {
          delta = false;
          for (
            let tokenCount = 0;
            tokenCount < bracketList.length - 1;
            tokenCount++
          ) {
            const pair =
              bracketList[tokenCount].string +
              bracketList[tokenCount + 1].string;
            if (["[]", "{}"].indexOf(pair) > -1) removePair(tokenCount);
          }
          round++;
          if (!delta) break;
          if (round >= maxIterations) break;
        }
        if (bracketList.length > 0) {
          const _tokenString = bracketList[0].string,
            _tokenPosition = bracketList[0].i,
            _closingBracketType = _tokenString === "[" ? "]" : "}";
          line = bracketList[0].line;
          setError(
            _tokenPosition,
            format(
              locale.brace[_closingBracketType === "]" ? "square" : "curly"]
                .missingClose,
            ),
          );
        }
      }
      if (!error)
        if ([undefined, ""].indexOf(buffer.json) === -1)
          try {
            buffer.jsObject = JSON.parse(buffer.json);
          } catch (err: any) {
            const errorMessage = err.message,
              subsMark = errorMessage.indexOf("position");
            if (subsMark === -1) throw new Error("Error parsing failed");
            const errPositionStr = errorMessage.substring(
                subsMark + 9,
                errorMessage.length,
              ),
              errPosition = parseInt(errPositionStr);
            let charTotal = 0,
              tokenIndex = 0,
              token: any = false,
              _line = 1,
              exitWhile = false;
            while (charTotal < errPosition && !exitWhile) {
              token = buffer.tokens_merge[tokenIndex];
              if ("linebreak" === token.type) _line++;
              if (["space", "linebreak"].indexOf(token.type) === -1)
                charTotal += token.string.length;
              if (charTotal >= errPosition) break;
              tokenIndex++;
              if (!buffer.tokens_merge[tokenIndex + 1]) exitWhile = true;
            }
            line = _line;
            let backslashCount = 0;
            for (let i = 0; i < token.string.length; i++) {
              const char = token.string.charAt(i);
              if (char === "\\")
                backslashCount = backslashCount > 0 ? backslashCount + 1 : 1;
              else {
                if (backslashCount % 2 !== 0 || backslashCount === 0)
                  if ("'\"bfnrt".indexOf(char) === -1) {
                    setError(
                      tokenIndex,
                      format(locale.invalidToken.unexpected, {
                        token: "\\",
                      }),
                    );
                  }
                backslashCount = 0;
              }
            }
            if (!error)
              setError(
                tokenIndex,
                format(locale.invalidToken.unexpected, {
                  token: token.string,
                }),
              );
          }
      let _line = 1,
        _depth = 0;
      function newIndent() {
        let space = [];
        for (let i = 0; i < _depth * 2; i++) space.push("&nbsp;");
        return space.join("");
      }
      function newLineBreak(byPass = false) {
        _line++;
        if (_depth > 0 || byPass) {
          return "<br>";
        }
        return "";
      }
      function newLineBreakAndIndent(byPass = false) {
        return newLineBreak(byPass) + newIndent();
      }
      if (!error)
        for (let i = 0; i < buffer.tokens_merge.length; i++) {
          const token = buffer.tokens_merge[i],
            string = token.string,
            type = token.type;
          switch (type) {
            case "space":
            case "linebreak":
              break;
            case "string":
            case "number":
            case "primitive":
            case "error":
              buffer.markup +=
                (followsSymbol(i, [",", "["]) ? newLineBreakAndIndent() : "") +
                newSpan(i, token, _depth);
              break;
            case "key":
              buffer.markup +=
                newLineBreakAndIndent() + newSpan(i, token, _depth);
              break;
            case "colon":
              buffer.markup += newSpan(i, token, _depth) + "&nbsp;";
              break;
            case "symbol":
              switch (string) {
                case "[":
                case "{":
                  buffer.markup +=
                    (!followsSymbol(i, [":"]) ? newLineBreakAndIndent() : "") +
                    newSpan(i, token, _depth);
                  _depth++;
                  break;
                case "]":
                case "}":
                  _depth--;
                  const islastToken = i === buffer.tokens_merge.length - 1,
                    _adjustment =
                      i > 0
                        ? ["[", "{"].indexOf(
                            buffer.tokens_merge[i - 1].string,
                          ) > -1
                          ? ""
                          : newLineBreakAndIndent(islastToken)
                        : "";
                  buffer.markup += _adjustment + newSpan(i, token, _depth);
                  break;
                case ",":
                  buffer.markup += newSpan(i, token, _depth);
                  break;
              }
              break;
          }
        }
      if (error) {
        let _line_fallback = 1;
        function countCarrigeReturn(string: any) {
          let count = 0;
          for (let i = 0; i < string.length; i++) {
            if (["\n", "\r"].indexOf(string[i]) > -1) count++;
          }
          return count;
        }
        _line = 1;
        for (let i = 0; i < buffer.tokens_merge.length; i++) {
          const token = buffer.tokens_merge[i],
            type = token.type,
            string = token.string;
          if (type === "linebreak") _line++;
          buffer.markup += newSpan(i, token, _depth);
          _line_fallback += countCarrigeReturn(string);
        }
        _line++;
        _line_fallback++;
        if (_line < _line_fallback) _line = _line_fallback;
      }
      for (let i = 0; i < buffer.tokens_merge.length; i++) {
        let token = buffer.tokens_merge[i];
        buffer.indented += token.string;
        if (["space", "linebreak"].indexOf(token.type) === -1)
          buffer.tokens_plainText += token.string;
      }
      if (error) {
        function isFunction(functionToCheck: any) {
          return (
            functionToCheck &&
            {}.toString.call(functionToCheck) === "[object Function]"
          );
        }
        if ("modifyErrorText" in this.props)
          if (isFunction(this.props.modifyErrorText))
            error.reason = this.props.modifyErrorText(error.reason);
      }
      return {
        tokens: buffer.tokens_merge,
        noSpaces: buffer.tokens_plainText,
        indented: buffer.indented,
        json: buffer.json,
        jsObject: buffer.jsObject,
        markup: buffer.markup,
        lines: _line,
        error: error,
      };
    }

    /**
     *     JS OBJECTS || PLACEHOLDER
     */

    if (!("nodeType" in something)) {
      let buffer: any = {
        inputText: JSON.stringify(something),
        position: 0,
        currentChar: "",
        tokenPrimary: "",
        tokenSecondary: "",
        brackets: [],
        isValue: false,
        stringOpen: false,
        stringStart: 0,
        tokens: [],
      };

      function escape_character() {
        if (buffer.currentChar !== "\\") return false;
        return true;
      }
      function extract(string: any, position: any) {
        return string.slice(0, position) + string.slice(position + 1);
      }
      function determine_string() {
        if ("'\"".indexOf(buffer.currentChar) === -1) return false;
        if (!buffer.stringOpen) {
          add_tokenSecondary();
          buffer.stringStart = buffer.position;
          buffer.stringOpen = buffer.currentChar;
          return true;
        }
        if (buffer.stringOpen === buffer.currentChar) {
          add_tokenSecondary();
          const stringToken = buffer.inputText.substring(
            buffer.stringStart,
            buffer.position + 1,
          );
          add_tokenPrimary(stringToken);
          buffer.stringOpen = false;
          return true;
        }
        return false;
      }
      function determine_value() {
        if (":,{}[]".indexOf(buffer.currentChar) === -1) return false;
        if (buffer.stringOpen) return false;
        add_tokenSecondary();
        add_tokenPrimary(buffer.currentChar);
        switch (buffer.currentChar) {
          case ":":
            buffer.isValue = true;
            return true;
            break;
          case "{":
          case "[":
            buffer.brackets.push(buffer.currentChar);
            break;
          case "}":
          case "]":
            buffer.brackets.pop();
            break;
        }
        if (buffer.currentChar !== ":")
          buffer.isValue = buffer.brackets[buffer.brackets.length - 1] === "[";
        return true;
      }
      function add_tokenSecondary() {
        if (buffer.tokenSecondary.length === 0) return false;
        buffer.tokens.push(buffer.tokenSecondary);
        buffer.tokenSecondary = "";
        return true;
      }
      function add_tokenPrimary(value: any) {
        if (value.length === 0) return false;
        buffer.tokens.push(value);
        return true;
      }
      for (let i = 0; i < buffer.inputText.length; i++) {
        buffer.position = i;
        buffer.currentChar = buffer.inputText.charAt(buffer.position);
        const a = determine_value(),
          b = determine_string(),
          c = escape_character();
        if (!a && !b && !c)
          if (!buffer.stringOpen) buffer.tokenSecondary += buffer.currentChar;
      }
      let buffer2: any = { brackets: [], isValue: false, tokens: [] };
      buffer2.tokens = buffer.tokens.map((token: any) => {
        let type = "",
          string = "",
          value: any = "";
        switch (token) {
          case ",":
            type = "symbol";
            string = token;
            value = token;
            buffer2.isValue =
              buffer2.brackets[buffer2.brackets.length - 1] === "[";
            break;
          case ":":
            type = "symbol";
            string = token;
            value = token;
            buffer2.isValue = true;
            break;
          case "{":
          case "[":
            type = "symbol";
            string = token;
            value = token;
            buffer2.brackets.push(token);
            buffer2.isValue =
              buffer2.brackets[buffer2.brackets.length - 1] === "[";
            break;
          case "}":
          case "]":
            type = "symbol";
            string = token;
            value = token;
            buffer2.brackets.pop();
            buffer2.isValue =
              buffer2.brackets[buffer2.brackets.length - 1] === "[";
            break;
          case "undefined":
            type = "primitive";
            string = token;
            value = undefined;
            break;
          case "null":
            type = "primitive";
            string = token;
            value = null;
            break;
          case "false":
            type = "primitive";
            string = token;
            value = false;
            break;
          case "true":
            type = "primitive";
            string = token;
            value = true;
            break;
          default:
            const C = token.charAt(0);
            function stripQuotesFromKey(text: any) {
              if (text.length === 0) return text;
              if (['""', "''"].indexOf(text) > -1) return "''";
              let wrappedInQuotes = false;
              for (let i = 0; i < 2; i++) {
                if (
                  [text.charAt(0), text.charAt(text.length - 1)].indexOf(
                    ['"', "'"][i],
                  ) > -1
                ) {
                  wrappedInQuotes = true;
                  break;
                }
              }
              if (wrappedInQuotes && text.length >= 2) text = text.slice(1, -1);
              const nonAlphaNumeric = text.replace(/\w/g, ""),
                alphaNumeric = text.replace(/\W+/g, ""),
                mayRemoveQuotes = ((nonAlphaNumeric, text) => {
                  let numberAndLetter = false;
                  for (let i = 0; i < text.length; i++) {
                    if (i === 0) if (isNaN(text.charAt(i))) break;
                    if (isNaN(text.charAt(i))) {
                      numberAndLetter = true;
                      break;
                    }
                  }
                  return !(nonAlphaNumeric.length > 0 || numberAndLetter);
                })(nonAlphaNumeric, text),
                hasQuotes = ((string) => {
                  for (let i = 0; i < string.length; i++) {
                    if (["'", '"'].indexOf(string.charAt(i)) > -1) return true;
                  }
                  return false;
                })(nonAlphaNumeric);
              if (hasQuotes) {
                let newText = "";
                const charList = text.split("");
                for (let ii = 0; ii < charList.length; ii++) {
                  let char = charList[ii];
                  if (["'", '"'].indexOf(char) > -1) char = "\\" + char;
                  newText += char;
                }
                text = newText;
              }
              if (!mayRemoveQuotes) return "'" + text + "'";
              else return text;
            }
            if ("'\"".indexOf(C) > -1) {
              if (buffer2.isValue) type = "string";
              else type = "key";
              if (type === "key") string = stripQuotesFromKey(token);
              if (type === "string") {
                string = "";
                const charList2 = token.slice(1, -1).split("");
                for (let ii = 0; ii < charList2.length; ii++) {
                  let char = charList2[ii];
                  if ("'\"".indexOf(char) > -1) char = "\\" + char;
                  string += char;
                }
                string = "'" + string + "'";
              }
              value = string;
              break;
            }
            if (!isNaN(token)) {
              type = "number";
              string = token;
              value = Number(token);
              break;
            }
            if (token.length > 0)
              if (!buffer2.isValue) {
                type = "key";
                string = token;
                if (string.indexOf(" ") > -1) string = "'" + string + "'";
                value = string;
                break;
              }
        }
        return {
          type: type,
          string: string,
          value: value,
          depth: buffer2.brackets.length,
        };
      });
      let clean = "";
      for (let i = 0; i < buffer2.tokens.length; i++) {
        let token = buffer2.tokens[i];
        clean += token.string;
      }
      function indent(number: any) {
        let space = [];
        for (let i = 0; i < number * 2; i++) space.push(" ");
        return (number > 0 ? "\n" : "") + space.join("");
      }
      let indentation = "";
      for (let i = 0; i < buffer2.tokens.length; i++) {
        let token = buffer2.tokens[i];
        switch (token.string) {
          case "[":
          case "{":
            const nextToken =
              i < buffer2.tokens.length - 1 - 1 ? buffer2.tokens[i + 1] : "";
            if ("}]".indexOf(nextToken.string) === -1)
              indentation += token.string + indent(token.depth);
            else indentation += token.string;
            break;
          case "]":
          case "}":
            const prevToken = i > 0 ? buffer2.tokens[i - 1] : "";
            if ("[{".indexOf(prevToken.string) === -1)
              indentation += indent(token.depth) + token.string;
            else indentation += token.string;
            break;
          case ":":
            indentation += token.string + " ";
            break;
          case ",":
            indentation += token.string + indent(token.depth);
            break;
          default:
            indentation += token.string;
            break;
        }
      }
      let lines = 1;
      function indentII(number: any) {
        let space = [];
        if (number > 0) lines++;
        for (let i = 0; i < number * 2; i++) space.push("&nbsp;");
        return (number > 0 ? "<br>" : "") + space.join("");
      }
      let markup = "";
      const lastIndex = buffer2.tokens.length - 1;
      for (let i = 0; i < buffer2.tokens.length; i++) {
        let token = buffer2.tokens[i];
        let span = newSpan(i, token, token.depth);
        switch (token.string) {
          case "{":
          case "[":
            const nextToken =
              i < buffer2.tokens.length - 1 - 1 ? buffer2.tokens[i + 1] : "";
            if ("}]".indexOf(nextToken.string) === -1)
              markup += span + indentII(token.depth);
            else markup += span;
            break;
          case "}":
          case "]":
            const prevToken = i > 0 ? buffer2.tokens[i - 1] : "";
            if ("[{".indexOf(prevToken.string) === -1)
              markup +=
                indentII(token.depth) + (lastIndex === i ? "<br>" : "") + span;
            else markup += span;
            break;
          case ":":
            markup += span + " ";
            break;
          case ",":
            markup += span + indentII(token.depth);
            break;
          default:
            markup += span;
            break;
        }
      }
      lines += 2;
      return {
        tokens: buffer2.tokens,
        noSpaces: clean,
        indented: indentation,
        json: JSON.stringify(something),
        jsObject: something,
        markup: markup,
        lines: lines,
      };
    }
  }
}

export default JSONInput;
