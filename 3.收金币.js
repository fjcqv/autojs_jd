/*
使用小X分身创建多个京东应用，应用名分别为京东2、京东3、京东4
脚本可以依次调用京东应用
 */
auto.waitFor();
console.show();
var appList = [];
var debugMode=String(engines.myEngine().getSource()).includes("remote:");
var config = storages.create("jd");
var taskTimeLimit = 60;
var appIndex = 0;

main();
function main() {
    解除限制();
    if (!debugMode && config.contains("app")) {
        appList = config.get("app");
        console.log("读取运行配置：", appList)
    } else {
        //获取所有京东
        var pm = context.getPackageManager()
        let list = pm.getInstalledApplications(0)
        for (let i = 0; i < list.size(); i++) {
            let p = list.get(i);
            if (p.label.match(/京东[0-9]*$|京东-.*$/)) {
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
    //运行京东
    while (appIndex < appList.length) {

        var thread = threads.start(task);
        //等待该线程完成
        thread.join(taskTimeLimit * 1000);
        if (thread.isAlive()) {
            thread.interrupt();
            console.error("运行失败，重新运行");
            for (var i = 0; i < 3; i++) {
                back();
                sleep(1000);
            }
        } else {
            appIndex += 1;
        }

    }
    toast("任务完成");
    if (!debugMode) {
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

}

function task() {
    console.info("开始运行", appList[appIndex]);
    stopApp(appList[appIndex]);
    setClip("");
    app.launchApp(appList[appIndex]);
    let startTime = new Date().getTime();//程序开始时间
    while (1) {
        if (desc("浮层活动").exists()) {
            console.log("点击浮层活动");
            var huodong = desc("浮层活动").findOne().bounds();
            randomClick(huodong.centerX(), huodong.centerY());
            sleep(1000);
        }
        if (textMatches(/[0-2]{2}:.*后满|领取金币/).exists()) {
            console.log("领取金币");
            var clickCollect = textMatches(/[0-2]{2}:.*后满|领取金币/).findOne();
            clickCollect.parent().click();
            sleep(1000);
            let h = new Date().getHours();
            //组队领取，未完成
            if (h >= 20 && h < 22) {
                id("homeBtnTeam").findOne().click();
                textContains("明天8点再来吧~").waitFor();
                sleep(1000);

                if (text("明天8点再来吧~").exists()) {
                    sleep(1000);
                    if (text("开心收下开心收下").exists()) {
                        console.log("开心收下");
                        text("开心收下开心收下").findOne().parent().click();
                        sleep(1000);
                    }
                    if (text("去开奖").exists()) {
                        console.log("去开奖");
                        text("去开奖").findOne().parent().click();
                        sleep(1000);
                        textContains("直接收下").waitFor();
                        textContains("直接收下").findOne().parent().click();
                    }
                }
            }
            //尝试升级
            try {
                let updateBtn = textStartsWith("抽奖 ").findOne(2000);
                for (let i = 0; i < 5; i++) {
                    updateBtn.click(); sleep(1000);
                }


            } catch (error) {
            }

            for (var i = 0; i < 3; i++) {
                back();
                sleep(1000);
            }
            break;
        }
        sleep(500);
    }
    let endTime = new Date().getTime();
    console.log("运行结束,共耗时" + (parseInt(endTime - startTime)) / 1000 + "秒");
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
function stopApp(appName) {
    openAppSetting(getPackageName(appName));
    className("android.widget.TextView").text(appName).waitFor();
    let is_sure = className("android.widget.Button").text("强行停止").findOne();
    if (is_sure.enabled()) {
        is_sure.click();
        try {
            id("message").findOne(3000);
            if (className("android.widget.Button").text("确定").exists()) {
                className("android.widget.Button").text("确定").findOne().click();
            }
            if (className("android.widget.Button").text("强行停止").exists()) {
                className("android.widget.Button").text("强行停止").findOne().click();
            }
            className("android.widget.TextView").text(appName).waitFor();
        }
        catch (e) {
            toastLog(e);
        }
        log(appName + "应用已被关闭");

        back();
    } else {
        log(appName + "应用不能被正常关闭或不在后台运行");
        back();
    }
}
function randomClick(x, y) {
    var rx = random(0, 5);
    var ry = random(0, 5);
    click(x + rx, y + ry);
}