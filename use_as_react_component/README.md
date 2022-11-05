# Online 3D Viewer with Next.js

## This is a work in progress! If you want to add or correct these examples, please submit a pull request!

There was a lack of documentation for Online 3D Viewer
and how to use it with React and Next.js, so I've made
this guide to help others encountering the same issue.
I'll show some examples of how you can use the Online 3D
Viewer and while also explaining some errors and issues
I encountered and how to resolve them. This is very much
a work in progress and isn't perfect, if you have any
feedback or additional advice, please submit a pull
request

To setup this project, clone the repo, npm install the
packages and run the server with npm run dev. I've only
tested this with stl and 3dm files, other files may
produce unique issues, if you encounter them, please let
me know

## Setting up Online 3D Viewer with your Next app:

First, install the npm package from
https://www.npmjs.com/package/online-3d-viewer. Import
the package into your project with `import * as OV from "online-3d-viewer"`

Secondly, on order for this package to work in your
project, make sure you have the libs folder in your
public folder, as shown in this repo. These are the
external packages used by Online-3D-Viewer to load the
different types of 3D file client side.
**THE PACKAGE WILL NOT WORK WITHOUT THESE PRESENT.**

This is all the setup you'll need and we'll now look at
the different ways you can use the viewer and load in
files

## Example 1: A basic 3D viewer

This is a very basic example of how you can have a file
input, upload a file and have it display in the 3D
viewer. This example will also clean up correctly,
avoiding memory leaks that can happen while using this
package with React . Using this example's component, you
can easily spin up multiple different viewers at the
same time and passing different files into each one,
though I would be careful doing so for reasons mentioned
at the bottom of this page.

See the "Basic3DViewer" component in the components
folder to see how this was constructed. I've left
annotated notes explaining how everything works but will
add some additional comments here

```
import { useEffect, useRef, useState } from "react";
import * as OV from "online-3d-viewer";

const Basic3DViewer = ({ file }) => {
    // The viewer is attached to parentDiv.current
    const parentDiv = useRef(null);
    // However, this really attaches the canvas element to the parentDiv, we need to also keep a reference for the viewer object itself which we'll do with viewerRef
    const viewerRef = useRef(null);

    useEffect(() => {
        // If there is a file passed in that isn't null, instantiate the viewer object
        if (file) {
            // Set the location of the libraries needed to load different models to lib, which in nextjs will point to "/public/libs"
            OV.SetExternalLibLocation("libs");
            // Initialise all the 3D viewer elements
            OV.Init3DViewerElements();
            // Before initialising the viewer, check that there isn't already a viewer object attached to viewerRef
            if (viewerRef.current === null) {
                // This is fairly self explanatory, initialise the viewer object with reasonable defaults. See the documentation for this component to see what other options you have
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
                // ! Ideally, you'd clean it up during cleanup but I just found it easier to replace and ignore this event instead
                viewer.Resize = () => {
                    console.log("I'm not resizing");
                };

                // Here, we assign the viewer object viewerRef.current to keep hold of it for later use
                viewerRef.current = viewer;

                // I've found This method of loading the file into the viewer works most reliably
                // Create a new data transfer object, add a File interface to it's items, grab the files and assign them to file_list and then load the model into the viewer with them
                var dt = new DataTransfer();
                dt.items.add(file);
                var file_list = dt.files;
                viewer.LoadModelFromFileList(file_list);
            }
        }

        return () => {
            // ! We need to correctly clean up our viewer, it's listeners and related model data to ensure memory leaks don't occur
            // ! If you want to see what can happen if this isn't here, comment out this code and repeatedly spin up multiple viewers and then do a heap snapshot with chrome and you will see a massive amount of data that isn't being cleaned up by the garbage collector
            // We first check that both the viewerRef and parentDiv aren't null so we don't call a method on an object that doesn't exist
            if (viewerRef.current !== null && parentDiv.current !== null) {
                // ! I threw the kitchen sink at this to get rid of the memory leaks so some of this code is definitely redundant and there is likely a cleaner way of doing this
                // We delete the model, reset the state of the renderer and clear the viewer
                delete viewerRef.current.model;
                viewerRef.current.viewer.renderer.resetState();
                viewerRef.current.viewer.Clear();
                // Then we delete the whole viewer object
                delete viewerRef.current.viewer;
                // We grab canvas element before we delete it to ensure we lose the webgl context and it doesn't persist
                const gl = viewerRef.current.canvas.getContext("webgl2");
                gl.getExtension("WEBGL_lose_context").loseContext();
                // We replace the canvas element which will also replace all the event listeners which can cause the element and things associated with it to not be correctly cleaned up by the garbage collector
                const tempClone = viewerRef.current.canvas.cloneNode(true);
                viewerRef.current.canvas.parentNode.replaceChild(
                    tempClone,
                    viewerRef.current.canvas
                );
                // Finally, we delete the canvas element and set the viewerRef.current to null, meaning everything should be properly cleaned up
                parentDiv.current.removeChild(parentDiv.current.children[0]);
                viewerRef.current = null;
            }
        };
    }, [file]);

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

export default Basic3DViewer;

```

You may notice that the method of loading files seems
over complicated. As the viewer loads files in using a
FileList, you don't need to extract the file, put it in
state, then use a DataTransfer object to recreate a
FileList. However, this method works better if you're
holding File Interfaces in state, e.g. with Zustand, and
passing them between components, as this way the
original file input DOM element doesn't need to be on
the page. This is useful using UI patterns like Wizards,
where a user may upload a file on one step and then the
app may need the file again on another step despite the
fact that DOM input is gone

## Example 2: Different methods to load files

There are two methods that I've used to load files into
the viewer: LoadModelFromFileList and
LoadModelFromInputFiles. If you need to load a file
uploaded through a DOM input by the user, use
LoadModelFromFileList and use the prior example. If you
want to load the file from a URL, use the example below.

As with the prior example, please see the
"ViewerWithUrls" component and see the annotated code.

```
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

```

### Example 3: Using viewer methods with your own UI

Obviously, most users will likely want to use this
package for more than just viewing 3D files.
Unfortunately, there isn't any real documentation on how
to do so and what can be done. I'll show some examples
here but until there is more documentation, I'd advise
you to read the code, particularly
https://github.com/kovacsv/Online3DViewer/blob/master/source/engine/viewer/viewer.js
and
https://github.com/kovacsv/Online3DViewer/blob/master/source/engine/viewer/embeddedviewer.js
to see what's possible

I haven't commented the code for this component, it's
fairly self explanatory. To better understand why
certain parameters are being passed into each function,
see the source code linked above

```
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

```

## Tips and things to avoid

-   You must wait for the component to mount with
    useEffect before instantiating the viewer as the
    viewer calls window on initialisation which is only
    present in the browser, not node
-   The package isn't well documented so there are two
    ways to figure out what functions can be used: read
    the source code or log the Viewer object and examine
    in the browser
-   Instantiating the viewer object creates a canvas DOM
    element that we need to hold onto with React's
    useRef
-   Another important thing is that you need to
    correctly clean up the instantiated EmbeddedViewer.
    You can't do this by just using something like
    `viewerRef = null` in the useEffect cleanup function
    as the DOM element will be cleaned up but not all
    the references to the model and the arrays that hold
    the geometry data. As such, we need to explicitly
    remove these. The code I have at the moment was
    haphazardly slapped together and likely contains
    redundancy, if you come up with a better solution,
    please let me know but it does correctly reduce the
    memory usage
-   Even with the above code, the JS garbage collector
    is not the fastest so if you're running multiple
    instances of the viewer, be careful to stagger them
    if possible, as your user's browsers may run out of
    memory, particularly on lower end devices
-   Even if you somehow don't manage to run out of
    memory, you will likely run out of WebGL contexts
    (see
    https://github.com/kovacsv/Online3DViewer/issues/320)
    which is capped at anywhere between 8-12 depending
    on the device and the browser
-   If you need to pass a file around between components
    where the initial input may be lost, consider
    storing the file in state using something like
    Zustand
