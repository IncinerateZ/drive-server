window.onload = function () {
    const canvas = document.getElementById('canvas');
    canvas.width = 600;
    canvas.height = 600;

    const ctx = canvas.getContext('2d');

    const BGS = [
        'bg_blue',
        'bg_green',
        'bg_red',
        'bg_yellow',
        'bg_gray',
        'bg_white',
    ];
    const HEADS = [
        [
            'head_circle_blue',
            'head_circle_green',
            'head_circle_red',
            'head_circle_gray',
        ],
        [
            'head_square_blue',
            'head_square_green',
            'head_square_red',
            'head_square_gray',
        ],
    ];

    const BODIES = ['body_blue', 'body_green', 'body_red', 'body_gray'];

    const bgPath = './features/bgs/';
    const bodyPath = './features/bodies/';
    const headPath = './features/heads/';

    // CODING
    // BG BODY HEADTYPE HEAD
    const map = {};

    //5 seconds before generation
    console.log('Generating Collectibles in 5 seconds');
    setTimeout(() => {
        function generateSingleCollectible() {
            const bgIdx = Math.floor(Math.random() * 6);
            const bodyIdx = Math.floor(Math.random() * 4);
            const headTypeIdx = Math.floor(Math.random() * 2);
            const headIdx = Math.floor(Math.random() * 4);
            console.log(
                `${BGS[bgIdx]} ${BODIES[bodyIdx]} ${HEADS[headTypeIdx][headIdx]}`,
            );

            let data = `${bgIdx}${bodyIdx}${headTypeIdx}${headIdx}`;
            if (map[data]) return false;
            map[data] = true;

            let imgs = [new Image(), new Image(), new Image()];
            imgs[0].src = bgPath + BGS[bgIdx] + '.png';
            imgs[1].src = bodyPath + BODIES[bodyIdx] + '.png';
            imgs[2].src =
                headPath +
                `${headTypeIdx === 0 ? 'circle' : 'square'}/` +
                HEADS[headTypeIdx][headIdx] +
                '.png';

            let counter = 3;

            for (let img of imgs) {
                img.onload = () => {
                    counter--;
                    if (counter === 0) {
                        for (let img of imgs) {
                            ctx.drawImage(img, 0, 0);
                        }
                    }
                };
            }
            
            //download
            var link = document.createElement('a');
            link.setAttribute(
                'download',
                `BlockHeads#${Object.keys(map).length}.png`,
            );
            link.setAttribute(
                'href',
                canvas
                    .toDataURL('image/png')
                    .replace('image/png', 'image/octet-stream'),
            );
            link.click();
            return true;
        }
        console.log('Generating Collectibles...');
        let count = 112;
        let interval = setInterval(() => {
            if (count <= 0) return clearInterval(interval);
            generateSingleCollectible() ? count-- : null;
            if (count % 10 === 0) console.log(count);
        }, 100);
    }, 5000);
};
