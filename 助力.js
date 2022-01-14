auto.waitFor();
console.show();
var Code = [
    "20:/￥28o9H0Xe6DDDW￥kankan婛※栋，❄赽咖叺莪哋隊⑤，躺赢賺葒笣~",
    "25:/#982pr8e7JnQMr%☆しāī京岽逛逛☆，﹎壹啓ɡμā汾10億!!!!!！ぷ",
    "20:/#18AO6DBmIqyUB@咑k鯨·=·鮗Ap/ρ，嚯！﹎壹啓ɡμā汾10億!!!!!！ぷ",
    "26:/#3AG9ZB2BSITy3%后扌丁开乛倞崬，﹎壹啓ɡμā汾10億!!!!!！ぷ",
    "24:/￥6EC4y7N71OIby%來jìnɡ倲逛逛╰→，﹎壹啓ɡμā汾10億!!!!!！ぷ",
    "24:/#86QtT4vzLaoUN%买买买，→亰咚，﹎壹啓ɡμā汾10億!!!!!！ぷ",
];


console.info("共" + Code.length + "个助力码");
for (var i = 0; i < Code.length;) {
    console.log("开始第" + (i + 1) + "个助力码");
    var j = 0;
    setClip(Code[i]);
    console.log("助力码写入剪切板");

    console.info("打开京东");
    app.launchApp("京东");
    console.log("等待任务检测……");


    if (text("立即查看").findOne(2000) == null) {
        console.log("等待APP识别助力码");
        while (j < 20 && text("立即查看").findOnce() == null) {
            if (text("立即查看").exists()) {
                break;
            }
            console.log(j + 1);
            j++;
            sleep(1000);
            if (j == 10) {
                console.log("未检测到新助力码，尝试再次复制");
                home(); sleep(1000);
                setClip(Code[i]);
                console.log("助力码重新写入剪切板");
                sleep(1000);
                console.info("打开京东");
                app.launchApp("京东");
                console.log("重启APP成功，等待再次检测");
                sleep(1000);
            }
        }
    }
    if (text("立即查看").exists()) {
        console.log("立即查看");
        text("立即查看").findOnce().click();
        j = 0;
        while (j < 20 && textMatches("加入队伍加入队伍|为TA助力为TA助力").findOnce()== null) {
            if (textMatches("加入队伍加入队伍|为TA助力为TA助力").exists()) {
                break;
            }
            sleep(2000);
            console.log("等待加载……" + (j + 1));
            j++;
        }
        if (j < 20) {
            sleep(1000);
            textMatches("加入队伍加入队伍|为TA助力为TA助力").findOnce().parent().click();
            sleep(2000);
            console.log("助力完成");
            i++;
        }
    }    
    home(); 
    sleep(2000);
}
console.log("当前账户已助力完成");