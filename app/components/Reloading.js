class Reloading extends React.Component {
    render() {
        return (
            <div style={{
                width: "100%",
                height: "100%", 
                backgroundColor: "rgb(206, 227, 250)",
                overflow: "hidden",
                borderRadius: "30px"
            }}>
                <div style={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: "linear-gradient(90deg, rgb(206, 227, 250) 0%, rgb(230, 240, 255) 50%, rgb(206, 227, 250) 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite"
                }} />

                <style>
                    {`
                    @keyframes shimmer {
                        0% {
                            background-position: -100% 0;
                        }
                        100% {
                            background-position: 100% 0;
                        }
                    }
                    `}
                </style>
            </div>
        );
    }
}
