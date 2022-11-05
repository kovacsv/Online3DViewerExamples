import { useEffect, useRef, useState } from "react";
import * as OV from "online-3d-viewer";

const ViewerWithUrls = ({ url, loadModel }) => {
    const parentDiv = useRef(null);
    const viewerRef = useRef(null);

    useEffect(() => {
        if (url && loadModel) {
            OV.SetExternalLibLocation("libs");
            OV.Init3DViewerElements();
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
                viewer.Resize = () => {
                    console.log("I'm not resizing");
                };

                // To load a file into the viewer using the url, we first pass a file name, OV.FileSource.Url and then the url of the model to the OV.InputFile constructor, put the newly created object in an array and save it as inputFiles
                let inputFiles = [
                    new OV.InputFile("test.stl", OV.FileSource.Url, url),
                ];

                viewerRef.current = viewer;

                // Then we just pass inputFiles into the below method and viola
                viewer.LoadModelFromInputFiles(inputFiles);
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
    }, [url, loadModel]);

    return (
        <>
            <div
                ref={parentDiv}
                role={"img"}
                aria-label="Canvas showing the model in the 3D Viewer"
                className="relative flex  flex-col items-center justify-center p-2 h-72 w-72 border-2 border-black rounded-sm"
            ></div>
        </>
    );
};

export default ViewerWithUrls;
