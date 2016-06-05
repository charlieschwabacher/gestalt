import React from 'react';

const WIDTH_HEIGHT_RATIO = 2 / Math.sqrt(3);
const RADIUS_HEIGHT_RATIO = 1 / 5;

export default ({
  height = 50,
  color = 'black',
}) => {
  const width = Math.round(WIDTH_HEIGHT_RATIO * height);
  const radius = Math.round(RADIUS_HEIGHT_RATIO * height);
  const points = [
    {x: width / 2, y: radius},
    {x: width - radius, y: height - radius},
    {x: radius, y: height - radius},
  ];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{verticalAlign: 'middle'}}
    >
      <defs>
        <mask id="triangle">
          <rect width="100%" height="100%" fill="white"/>
          <polygon
            fill='black'
            points={points.map(({x, y}) => `${x} ${y}`).join(' ')}
          />
        </mask>
      </defs>
      <g fill={color}>
        {
          points.map(({x, y}, i) =>
            <circle key={i} cx={x} cy={y} r={radius} mask='url(#triangle)'/>
          )
        }
      </g>
    </svg>
  );
};
