import React,{useEffect,useState} from 'react';

export const Input = ({value, placeholder,name, action})=>{
    return(
        <input 
            type="text"
            value={value}
            name={name}
            placeholder={placeholder}
            onChange={e=>action(e)}
        />
    )
}