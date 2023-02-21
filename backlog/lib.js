const sdk = require("tellojs");
const h264 = require("h264decoder");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("ffmpeg");

async function start_stream() {

    console.log(`Starting stream...`);

    const rawOutputStream = fs.createWriteStream('raw.h264');

    const videoEmitter = await sdk.receiver.video.bind();
    videoEmitter.on('message', (res) => {
        const status = decoder.decode(res);

        if (!rawOutputStream.closed)
            rawOutputStream.write(res);

        if (status == h264.H264Decoder.PIC_RDY)
        {
            //console.log("Pic ready");
            write_picture();
        }
    });

    let i = 0;
    function write_picture() {
        const img = decoder.pic;
        const img_name = path.join("imgs", `img_${++i}.yuv`);


        fs.writeFile(img_name, img, (err) => {
            if (err)
                {console.log(`Could not write ${img_name} : ${err}`);}
            else
                {
                    //console.log(`Wrote ${img_name}`);
                }
        })
    }

    let _i = 0;
    setInterval( () => {
        console.log(`TIME ELAPSED: ${++_i} seconds`);
    }, 1000)
    setTimeout( () => {
        rawOutputStream.end();
        console.log("Wrote raw");
    }, 10000)
};

async function main() {
    await sdk.control.connect();

    const battery = await sdk.read.battery();
    // const sdkVersion = await sdk.read.sdk();
    // const wifi = await sdk.read.wifi();
    // const serial = await sdk.read.sn();

    console.log(`Battery: ${battery.trim()}%`);
    // console.log(`SDK Version: ${sdkVersion}`);
    // console.log(`Wifi SNR: ${wifi}`);
    // console.log(`Serial number: ${serial}`);

    await start_stream();
}

try {
    main();
} catch (e) {
    console.log(e);
}