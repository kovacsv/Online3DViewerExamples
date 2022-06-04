import * as OV from 'online-3d-viewer';

// Set the external libraries location to the
// folder it copied during build.
OV.SetExternalLibLocation ('build/libs');

// Init all the 3d viewer elements.
OV.Init3DViewerElements ();
