const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = { size: 96 };

const parseSource = (source) => {
    if (source.includes('/') || source.includes('\\')) {
        try {
            const stat = fs.statSync(source);

            if (stat.isDirectory()) {
                console.error(`Error: must provide a file for source, directory provided instead.`);
                return process.exit();
            }

            source = fs.readFileSync(source, 'utf8').toString();
        } catch (e) {
            console.error(`Error attempting to read ${source} from file system.`);
            return process.exit();
        }
    }

    return source
        .split(/,|\n|\t/)
        .map(s => s.trim())
        .filter(s => s);
};

const parseTarget = (target) => {
    if (!target) {
        return null;
    }

    try {
        const stat = fs.statSync(target);

        if (!stat.isDirectory()) {
            console.error(`Error: must provide a directory for target, file provided instead.`);
            return process.exit();
        }
    } catch (e) {
        console.error(`Error attempting to read ${target} from file system.`);
        return process.exit();
    }

    return path.resolve(__dirname, target);
};

const parseConfig = (args) => args.reduce((conf, arg) => Object.assign(conf, {
    [arg.split('=')[0].replace('--', '')]: arg.split('=')[1]
}), DEFAULT_CONFIG);;

module.exports = () => {
    const args = process.argv.slice(2);

    if (!args[0] || ['help', '--help', '-h'].includes(args[0])) {
        return { help: true };
    }

    return {
        people: parseSource(args[0]),
        targetDir: parseTarget(args[1]),
        config: parseConfig(args.slice(2)),
    };
};
