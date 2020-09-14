const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const parseArgs = require('./parse-args');

const BASE_URL = 'https://graph.microsoft.com/v1.0';
const TOKEN = process.env.MS_AUTH_TOKEN;

const wait = (ms) => new Promise(res => setTimeout(res, ms));

const get = async (url, isJSON = true) => {
    const res = await fetch(`${BASE_URL}${url}`, { headers: { authorization: `Bearer ${TOKEN}` } });

    if (!isJSON) {
        return res;
    }

    const json = await res.json();

    return json;
}

const getPerson = async (name) => {
    const { value } = await get(`/me/people?$search="${name}"`);

    if (!value || !value.length) {
        console.warn(`No users matched the provided name "${name}", skipping.`);
        return null;
    }

    if (value.length > 1) {
        console.warn(`Multiple users matched the provided name "${name}", using first.`);
    }

    return value[0];
};

const getPhotoExtension = async (id) => {
    try {
        const data = await get(`/users/${id}/photo`);

        return data['@odata.mediaContentType'].split('/').pop();
    } catch (e) {
        console.warn(`No photo was found for provided id "${id}", skipping.`);
        return null;
    }
};

const getPhoto = async (id, size) => {
    try {
        const res = await get(`/users/${id}/photos/${size}x${size}/$value`, false);

        return res.body;
    } catch (e) {
        console.warn(`No photo was found for provided id "${id}", skipping.`);
        return null;
    }
};

const saveImageFor = async (person, dir, config) => {
    const details = await getPerson(person);

    if (!details) {
        return;
    }

    const ext = await getPhotoExtension(details.id);

    if (!ext) {
        return;
    }

    const photo = await getPhoto(details.id, config.size);

    if (!photo) {
        return;
    }

    const dest = path.join(dir, `${details.givenName}.${details.surname}.${ext}`.toLowerCase());
    const stream = fs.createWriteStream(dest);

    return new Promise((res) => {
        photo.pipe(stream);
        photo.on('error', (e) => {
            console.warn(`Failed to save ${person}. Error:`, e);
            res();
        });
        stream.on('finish', res);
    });
};

const saveImagesFor = (people, dir, config) => Promise.all(people.map(async (person, i) => {
    await wait(i * 0); // add a delay to avoid hitting API call limit...maybe?
    await saveImageFor(person, dir, config);
}));

const printHelp = () => {
    console.log('MS Image Puller:')
    console.log('\t<people>|<file> - comma deliminated list of names or emails or a file containing the list with a delimiter (,;\\n;\\t).');
    console.log('\t<target> - directory in which to place the photos.');
    console.log('\t[--size=<int>] - dimension of photo to store. Supported values are (48, 64, *96*, 120, 240, 360, 432, 504, 648).\n');
    console.log('\t<MS_AUTH_TOKEN> - required environment variable for auth token.\n');
};

(async function main() {
    const args = parseArgs();

    if (args.help) {
        printHelp();
        return process.exit();
    }

    if (!TOKEN) {
        console.error('ERROR: must provide an auth token via environment variable "MS_AUTH_TOKEN".');
        console.error('\tA token can easily be retrieved from: https://developer.microsoft.com/en-us/graph/graph-explorer');
        return process.exit();
    }

    if (!args.targetDir) {
        console.error('A target directory to put images must be provided.\n');
        printHelp();
        return process.exit();
    }

    if (!args.people) {
        console.error('A list of users to pull images for must be provided.\n');
        printHelp();
        return process.exit();
    }

    try {
        await saveImagesFor(args.people, args.targetDir, args.config);
    } catch (e) {
        console.log(e);
    }

    console.log(`Save completed. Images available at ${args.targetDir}`);
})();
