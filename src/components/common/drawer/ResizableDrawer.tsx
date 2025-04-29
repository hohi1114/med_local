import { Drawer } from "antd";
import { useEffect, useState } from "react";

interface ResizableDrawerProps {
  width: number;
  minWidth: number;
  maxWidth: number;
  handleWidth: (width: number) => void;
  isOpenDrawer: boolean;
  handleIsDrawerOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
}

const ResizableDrawer = ({
  isOpenDrawer,
  handleWidth,
  handleIsDrawerOpen,
  children,
  width,
  minWidth,
  maxWidth
}: ResizableDrawerProps) => {
  const [isResizing, setIsResizing] = useState(false);

  const onMouseDown = () => {
    setIsResizing(true);
  };

  const onMouseUp = () => {
    setIsResizing(false);
  };

  const onMouseMove = (e: { clientX: number }) => {
    if (isResizing) {
      let offsetRight =
        document.body.offsetWidth - (e.clientX - document.body.offsetLeft);

      if (offsetRight > minWidth && offsetRight < maxWidth) {
        handleWidth(offsetRight);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  });

  return (
    <Drawer
      width={width}
      placement="right"
      onClose={() => handleIsDrawerOpen(false)}
      styles={{
        header: {
          padding: "0.8rem 1rem"
        },
        mask: { backgroundColor: "rgba(0, 0, 0, 0)", pointerEvents: "none" },
        body: {
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }
      }}
      open={isOpenDrawer}
    >
      <div
        style={{
          position: "absolute",
          width: "1.5rem",
          padding: "4px 0 0",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          cursor: "ew-resize"
        }}
        onMouseDown={onMouseDown}
      ></div>
      {children}
    </Drawer>
  );
};

export default ResizableDrawer;
