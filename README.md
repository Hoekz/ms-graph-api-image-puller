# MS Image Puller

## Setup

1) `npm install`
2) `export MS_AUTH_TOKEN=<TOKEN>` - [get a token easily from here](https://developer.microsoft.com/en-us/graph/graph-explorer)

## Run

`node index <source> <target> [config]`

Example: `node index "James Hoekzema" . --size=96`

## Arguments

 - `<source>` - comma deliminated list of names or emails or a file containing the list with a delimiter (,;\\n;\\t).
 - `<target>` - directory in which to place the photos.
 - `--size=<int>` - dimension of photo to store. Supported values are (48, 64, *96*, 120, 240, 360, 432, 504, 648).
