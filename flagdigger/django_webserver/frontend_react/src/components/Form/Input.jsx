import React from 'react';

const Input = ({ className, labelClassName,
    inputClassName,
    labelText,
    type,
    name,
    onChange,
    required,
    placeholder,
    value,
    error,
}) => {
    console.log(labelText);

    return (
        <div className={`${className ? className : ''}`}>
            {labelText ? <label className={labelClassName}>{labelText}</label> : null}
            <input type={type}
                className={inputClassName}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
            />
            {error ? <span className="form-group-error">{error}</span> : null}
        </div>
    )
}

export default Input;
