const AiIcon = ({ size = 24, color = "currentColor", ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      {...props}
    >
      {/* "AI" 文字 - 水平和垂直完全居中 */}
      <text
        x="50"
        y="50"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="600"
        fontSize="70"
        textAnchor="middle"
        dominantBaseline="central"
        fill="black"
      >
        AI
      </text>
    </svg>
  );
};

export default AiIcon;
