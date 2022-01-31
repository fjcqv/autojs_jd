auto.waitFor();
console.show();

var appList = [];
var config = storages.create("jd");
var taskTimeLimit = 180;
var appIndex = 0;
var taskStatus = false;
var Code = [
];


main();
function main() {
    解除限制();
    //获取所有京东
    if (config.contains("app")) {        
        appList = config.get("app");
        console.log("读取运行配置：",appList)
    } else {
        //获取所有京东
        var pm = context.getPackageManager()
        let list = pm.getInstalledApplications(0)
        for (let i = 0; i < list.size(); i++) {
            let p = list.get(i);
            if (p.label.match(/京东[0-9]*$/)) {
                appList.push(p.label);
            }
            appList.sort();
        }
        var i = dialogs.select("请选择运行", appList.concat("所有"));
        if (i < appList.length) {
            appList = new Array(appList[i]);
            toast("单独运行" + appList[0]);
        } else {
            toast("运行所有京东");
        }
    }
    try {
        var h = http.get("https://raw.fastgit.org/fjcqv/autojs_jd/main/助力.json");
        Code = h.body.json();
    } catch (error) {
    }
    console.info("共" + Code.length + "个助力码");
    //运行京东
    while (appIndex < appList.length && Code.length) {

        var thread = threads.start(task);
        //等待该线程完成
        thread.join(taskTimeLimit * 1000);
        thread.interrupt();
        if (taskStatus) {
            taskStatus = false;
            appIndex += 1;
        } else {
            console.error("运行失败，重新运行");
            for (var i = 0; i < 3; i++) {
                back();
                sleep(1000);
            }
        }

    }
    toast("任务完成");
    recents();
    var w = id("clear_all_recents_image_button").findOne(6000);
    //如果找到控件则点击
    if (w != null) {
        w.click();
    } else {
        //否则提示没有找到
        toast("一键清理失败");
    }
}
function task() {
    console.info("开始运行", appList[appIndex]);
    let startTime = new Date().getTime();//程序开始时间
    for (var i = 0; i < Code.length;) {
        console.log("开始第" + (i + 1) + "个助力码");
        var j = 0;
        setClip(Code[i]);
        console.log("助力码写入剪切板");

        console.info("打开京东");
        app.launchApp(appList[appIndex]);
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
                    app.launchApp(appList[appIndex]);
                    console.log("重启APP成功，等待再次检测");
                    sleep(1000);
                }
            }
        }
        if (text("立即查看").exists()) {
            console.log("立即查看");
            text("立即查看").findOnce().click();
            j = 0;
            while (j < 20 && textMatches("帮TA助力").findOnce() == null) {
                if (textMatches("帮TA助力").exists()) {
                    break;
                }
                sleep(2000);
                console.log("等待加载……" + (j + 1));
                j++;
            }
            if (j < 20) {
                sleep(1000);
                textMatches("帮TA助力").findOnce().click();
                sleep(2000);
                console.log("助力完成");
                i++;
            }
        }
        home();
        sleep(2000);
    }
    console.log("当前账户已助力完成");
    let endTime = new Date().getTime();
    console.log("运行结束,共耗时" + (parseInt(endTime - startTime)) / 1000 + "秒");
    taskStatus = true;
}
function 解除限制() {
    importClass(com.stardust.autojs.core.accessibility.AccessibilityBridge.WindowFilter);
    let bridge = runtime.accessibilityBridge;
    let bridgeField = runtime.getClass().getDeclaredField("accessibilityBridge");
    let configField = bridgeField.getType().getDeclaredField("mConfig");
    configField.setAccessible(true);
    configField.set(bridge, configField.getType().newInstance());

    bridge.setWindowFilter(new JavaAdapter(AccessibilityBridge$WindowFilter, {
        filter: function (info) {
            return true;
        }
    }));
    auto.setWindowFilter(function (window) {
        return window.active;
    });
    console.log("解除限制");
}



