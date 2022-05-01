import Confetti from 'react-confetti'
import React, { useLayoutEffect, useState } from 'react';

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}


export default () => {
    const [width, height] = useWindowSize();
  return (
    <Confetti
      width={width}
      height={height}
      numberOfPieces={600}
      gravity={0.4}
    />
  )
}