import React, { useEffect, useState, ReactNode } from "react";
import Loading from "../components/common/Loading";

interface NaverScriptLoaderProps {
  children: ReactNode;
}

export default function NaverScriptLoader({
  children
}: NaverScriptLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.naver?.maps) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${
      import.meta.env.VITE_NAVER_MAPS_CLIENT_ID
    }`; // No &submodules=geometry anymore
    script.async = true;

    script.addEventListener("load", () => {
      if (window.naver?.maps) {
        setLoaded(true);
      } else {
        console.error(
          "Naver Maps script loaded, but `window.naver.maps` is missing!"
        );
      }
    });

    document.head.appendChild(script);
  }, []);

  if (!loaded) {
    return <Loading content="지도를 불러오고 있습니다." />;
  }

  return <>{children}</>;
}
