import React, {useState, useEffect, useCallback, useImperativeHandle, useRef} from "react";
import {useSharedContext} from "./SharedContextProvider";

const SearchBox = ({customQuery, fields, id, initialValue, placeholder, isPreventOnChange, onSearchExecute}, ref) => {
    const [{widgets}, dispatch] = useSharedContext();
    const [value, setValue] = useState(initialValue || "");
    const inputRef = ref ? ref : useRef(null);

    // Update external query on mount.
    useEffect(() => {
        update(value);
    }, []);

    // If widget value was updated elsewhere (ex: from active filters deletion)
    // We have to update and dispatch the component.
    useEffect(() => {
        if (!isPreventOnChange) {
            widgets.get(id) && update(widgets.get(id).value);
        }
    }, [isValueReady()]);

    // Build a query from a value.
    function queryFromValue(query) {
        if (customQuery) {
            return customQuery(query);
        } else if (fields) {
            return query ? {multi_match: {query, type: "phrase", fields}} : {match_all: {}};
        }
        return {match_all: {}};
    }

    useImperativeHandle(inputRef, () => ({
        rerender() {
            update(value);
        }
    }));

    // This functions updates the current values, then dispatch
    // the new widget properties to context.
    // Called on mount and value change.
    function update(v) {
        setValue(v);
        dispatch({
            type: "setWidget",
            key: id,
            needsQuery: true,
            needsConfiguration: false,
            isFacet: false,
            wantResults: false,
            query: queryFromValue(v),
            value: v,
            configuration: null,
            result: null
        });
    }

    // Checks if widget value is the same as actual value.
    function isValueReady() {
        return !widgets.get(id) || widgets.get(id).value == value;
    }

    // Destroy widget from context (remove from the list to unapply its effects)
    useEffect(() => () => dispatch({type: "deleteWidget", key: id}), []);
    const onKeyPress = useCallback(event => {
        if (event.nativeEvent && event.nativeEvent.keyCode == 13) {
            event.preventDefault();
            event.target.blur();
            if (onSearchExecute) {
                onSearchExecute(event.target.value);
            } else {
                update(event.target.value);
            }
        }
    });

    const onChange = useCallback((event) => {
        if (isPreventOnChange) {
            setValue(event.target.value);
        } else {
            if (onSearchExecute) {
                onSearchExecute(event.target.value);
            } else {
                update(event.target.value);
            }
        }
    }, [setValue]);

    const onClickSearchButton = useCallback(_ => {
        if (onSearchExecute) {
            onSearchExecute(value);
        } else {
            update(value);
        }
    }, [value]);

    return (
        <div id="site_header_center" style={{
            display: "flex",
            boxSizing: "border-box",
            lineHeight: 1.5,
            justifyContent: "center",
            width: "100%"
        }}>
            <div className="main-search-input-block"
                 style={{display: "flex", margin: "auto", position: "relative", justifyContent: "center"}}>
                <span className="search-icon" style={{
                    height: "38px",
                    width: "38px",
                    borderRadius: "100%",
                    fontSize: "19px",
                    lineHeight: "35px",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    overflow: "hidden",
                    background: "#e12a45",
                    color: "#fff",
                    cursor: "pointer",
                    zIndex: 8
                }} onClick={onClickSearchButton}></span>
                <input
                    style={{
                        height: "38px",
                        width: "319px",
                        border: "1px solid #e12a45",
                        borderRadius: "19px",
                        fontSize: "19px",
                        padding: "14px"
                    }}
                    type="text"
                    ref={inputRef}
                    defaultValue={value}
                    enterKeyHint="search"
                    onKeyPress={onKeyPress}
                    onChange={onChange}
                    placeholder={placeholder || "search…"}
                />
            </div>
        </div>
    );
}

export default React.forwardRef(SearchBox);
