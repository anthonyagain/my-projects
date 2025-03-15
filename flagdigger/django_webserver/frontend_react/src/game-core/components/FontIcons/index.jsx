import React from 'react';

const Icons = ({ d, height = "2rem", width = "2rem", onClick, className, viewBox ="0 0 320 512" }) => {

    return (
        <svg stroke="currentColor"
            onClick={onClick && (() => onClick())}
            className={className}
            strokeWidth="0" aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            height={height}
            width={width}
            viewBox={viewBox}>
            <path fill="currentColor" d={d}></path>
        </svg>
    )
}

export default Icons;