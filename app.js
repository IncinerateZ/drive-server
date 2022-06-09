require('dotenv').config();

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        struct = req.body.struct;
        iter(struct, '../store', file.originalname, cb);
    },
    filename(req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

const dree = require('dree');

const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];

//cors allow all origins
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: '1gb',
        parameterLimit: 1000000,
    }),
);
// app.use(fileUpload({ createParentPath: true }));
app.use(cors({ origin: process.env.CLIENT, credentials: true }));
app.use(cookieParser());

var public = path.join(__dirname, '../store');
var tmp = path.join(__dirname, '../temp');
app.use(express.static(public));
app.use(express.static(tmp));

app.get('/', (req, res) => {
    res.json({ message: 'drive-server v1.11' });
});

app.get('/delete/file/:dir*', (req, res) => {
    fs.unlink(`../store/${req.params.dir + req.params[0]}`, () => {
        res.json({ message: 'File deleted' });
    });
});

app.get('/delete/folder/:dir*', (req, res) => {
    fs.rm(
        `../store/${req.params.dir + req.params[0]}`,
        { recursive: true, force: true },
        () => {
            res.json({ message: 'Folder deleted' });
        },
    );
});

app.get('/file/:dir*', (req, res) => {
    // handle files
    if (req.params[0].split('.').length > 1) {
        if (
            imageTypes.includes(
                req.params[0].split('.')[req.params[0].split('.').length - 1],
            )
        )
            res.sendFile(
                path.join(public, `${req.params.dir + req.params[0]}`),
            );
        else
            res.download(
                path.join(public, `${req.params.dir + req.params[0]}`),
            );
    } else {
        const archive = archiver('zip');

        const name = randName(10);
        const out = fs.createWriteStream(`../temp/${name}.zip`);

        archive.pipe(out);

        archive.directory(
            `../store/${req.params.dir + req.params[0]}`,
            `${req.params[0]}`,
        );

        archive.finalize();

        out.on('close', () => {
            res.download(
                path.join(tmp, `${name}.zip`),
                `${
                    req.params[0].length === 0 ? req.params.dir : req.params[0]
                }.zip`,
                () => {
                    fs.unlink(`../temp/${name}.zip`, () => {});
                },
            );
        });
    }
});

app.get('/files', async (req, res) => {
    let files =
        (
            await dree.scanAsync('../store/', {
                depth: 1,
                normalize: true,
                hash: false,
                size: true,
            })
        ).children || [];
    for (let f of files) {
        delete f['path'];
        delete f['isSymbolicLink'];
        delete f['sizeInBytes'];
    }
    res.json({
        struct: files,
    });
});

app.get('/files/:dir*', async (req, res) => {
    let files = (
        await dree.scanAsync('../store/' + req.params.dir + req.params[0], {
            depth: 1,
            normalize: true,
            hash: false,
            size: true,
        })
    ).children;
    if (files)
        for (let f of files) {
            delete f['path'];
            delete f['isSymbolicLink'];
            delete f['sizeInBytes'];
        }
    res.json({
        struct: files,
    });
});

app.get('/newFolder/:dir*', (req, res) => {
    fs.mkdir(`../store/${req.params.dir + req.params[0]}`, () => {
        res.json({ message: 'Folder created' });
    });
});

app.post('/upload/', upload.any(), async (req, res) => {
    res.json({ message: 'Uploaded!' });
});

app.get('/logout', (req, res) => {
    res.clearCookie('AUTHORIZED', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    res.json({ message: 'Logged out' });
});

app.get('/auth/', (req, res) => {
    if (req.query.password === process.env.PASSWORD) {
        res.cookie('AUTHORIZED', '.', {
            expires: new Date(new Date().getTime() + 86_400_000),
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
        res.json({ message: 'Authenticated', r: '/' });
    } else if (req.cookies.AUTHORIZED) res.json({ message: 'Authenticated' });
    else res.json({ message: 'Not authenticated', r: '/auth' });
});

function iter(struct, root = '../store', target = '', cb = () => {}) {
    Object.keys(struct).forEach(function (k) {
        if (struct[k] !== null && typeof struct[k] === 'object') {
            iter(struct[k], root + '/' + k);
            return;
        }
        if (typeof struct[k] === 'string') {
            cb(null, root.replace('__files__', struct[k]));
            return;
        }
    });
}

function randName(length) {
    var result = '';
    var characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength),
        );
    }
    return result;
}

let port = process.env.PORT;

app.listen(port, () => {
    console.log('Started at port ' + port);
});
