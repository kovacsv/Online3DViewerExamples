import { useEffect, useRef, useState } from "react";
import * as OV from "online-3d-viewer";

const ViewerWithUI = ({ file }) => {
    const parentDiv = useRef(null);
    const viewerRef = useRef(null);
    const [volume, setVolume] = useState(null);
    const [surfaceArea, setSurfaceArea] = useState(null);

    useEffect(() => {
        console.log(file);
        console.log(parentDiv);
        if (file) {
            OV.SetExternalLibLocation("libs");
            OV.Init3DViewerElements();
            // initialize the viewer with the parent element and some parameters
            if (viewerRef.current === null) {
                let viewer = new OV.EmbeddedViewer(parentDiv.current, {
                    camera: new OV.Camera(
                        new OV.Coord3D(-150.0, 200.0, 300.0),
                        new OV.Coord3D(0.0, 0.0, 0.0),
                        new OV.Coord3D(0.0, 1.0, 0.0),
                        45.0
                    ),
                    backgroundColor: new OV.RGBAColor(255, 255, 255, 255),
                    defaultColor: new OV.RGBColor(0, 100, 100),
                    edgeSettings: {
                        showEdges: false,
                        edgeThreshold: 1,
                    },
                    environmentMap: [
                        "../website/assets/envmaps/grayclouds/posx.jpg",
                        "../website/assets/envmaps/grayclouds/negx.jpg",
                        "../website/assets/envmaps/grayclouds/posy.jpg",
                        "../website/assets/envmaps/grayclouds/negy.jpg",
                        "../website/assets/envmaps/grayclouds/posz.jpg",
                        "../website/assets/envmaps/grayclouds/negz.jpg",
                    ],
                    onModelLoaded: () => {
                        console.log(viewerRef.current.GetViewer());
                    },
                });
                // ! This feels stupid but unfortunately, this resizing event can persist after clean up and lead to an error, one way to avoid this happening is to just overwrite the method so that it doesn't call this.viewer
                viewer.Resize = () => {
                    console.log("I'm not resizing");
                };
                viewerRef.current = viewer;
                var dt = new DataTransfer();
                dt.items.add(file);
                var file_list = dt.files;
                viewer.LoadModelFromFileList(file_list);
            }
        }

        return () => {
            if (viewerRef.current !== null && parentDiv.current !== null) {
                delete viewerRef.current.model;
                viewerRef.current.viewer.renderer.resetState();
                viewerRef.current.viewer.Clear();
                delete viewerRef.current.viewer;
                const gl = viewerRef.current.canvas.getContext("webgl2");
                gl.getExtension("WEBGL_lose_context").loseContext();
                const tempClone = viewerRef.current.canvas.cloneNode(true);
                viewerRef.current.canvas.parentNode.replaceChild(
                    tempClone,
                    viewerRef.current.canvas
                );
                parentDiv.current.removeChild(parentDiv.current.children[0]);
                // viewerRef.current.canvas.parentNode.removeChild(viewerRef.current.canvas);
                // viewerRef.current.canvas.remove()
                viewerRef.current = null;
            }
        };
    }, [file]);

    const Direction = { X: 1, Y: 2, Z: 3 };

    const setUpVectorZ = () => {
        if (viewerRef.current) {
            viewerRef.current
                .GetViewer()
                .SetUpVector(
                    Direction.Z,
                    viewerRef.current.GetViewer().GetCamera()
                );
        }
    };
    const setUpVectorY = () => {
        if (viewerRef.current) {
            viewerRef.current
                .GetViewer()
                .SetUpVector(
                    Direction.Y,
                    viewerRef.current.GetViewer().GetCamera()
                );
        }
    };

    const getSurfaceArea = () => {
        if (viewerRef.current) {
            let boundingBox = viewerRef.current
                .GetViewer()
                .GetBoundingBox(
                    () => viewerRef.current.GetViewer().geometry.mainObject
                );
            const objSurfaceArea = OV.CalculateSurfaceArea(
                viewerRef.current.GetModel()
            );
            setSurfaceArea(objSurfaceArea.toFixed(2));
        }
    };

    const getVolume = () => {
        if (viewerRef.current) {
            let boundingBox = viewerRef.current
                .GetViewer()
                .GetBoundingBox(
                    () => viewerRef.current.GetViewer().geometry.mainObject
                );
            const objVolume = OV.CalculateVolume(viewerRef.current.GetModel());
            setVolume(objVolume.toFixed(2));
        }
    };

    const turnOnEdge = () => {
        viewerRef.current
            .GetViewer()
            .SetEdgeSettings(true, { r: 0, g: 0, b: 0 }, 0.3);
    };

    return (
        <>
            <div className="flex flex-row h-10 gap-2">
                <div
                    className="bg-blue-400 border-2 border-black rounded-sm p-2 py-1 cursor-pointer"
                    onClick={() => getVolume()}
                >
                    Calculate Volume
                </div>
                <div
                    className="bg-blue-400 border-2 border-black rounded-sm p-2 py-1 cursor-pointer"
                    onClick={() => getSurfaceArea()}
                >
                    Calculate Surface Area
                </div>
                <div
                    className="bg-blue-400 border-2 border-black rounded-sm p-2 py-1 cursor-pointer"
                    onClick={() => setUpVectorY()}
                >
                    Set Vector Y
                </div>
                <div
                    className="bg-blue-400 border-2 border-black rounded-sm p-2 py-1 cursor-pointer"
                    onClick={() => setUpVectorZ()}
                >
                    Set Vector Z
                </div>
                <div
                    className="bg-blue-400 border-2 border-black rounded-sm p-2 py-1 cursor-pointer"
                    onClick={() => turnOnEdge()}
                >
                    Turn on Edge
                </div>
            </div>
            <div
                ref={parentDiv}
                role={"img"}
                aria-label="Canvas showing the model in the 3D Viewer"
                className="relative flex  flex-col items-center justify-center p-2 h-72 w-72 border-2 border-black rounded-sm"
            ></div>
            <div className="flex flex-row h-10 gap-2">
                {volume && (
                    <p>
                        Volume: {volume}mm<sup>3</sup>
                    </p>
                )}
                {surfaceArea && (
                    <p>
                        Surface Area: {surfaceArea}mm<sup>2</sup>
                    </p>
                )}
            </div>
        </>
    );
};

export default ViewerWithUI;
