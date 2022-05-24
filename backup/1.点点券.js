/*
使用小X分身创建多个京东应用，应用名分别为京东2、京东3、京东4
脚本可以依次调用京东应用
 */
auto.waitFor();
console.show();
var appList = [];
var config = storages.create("jd");
var taskTimeLimit = 300;
var appIndex = 0;
var LauchAPPName = "";

main();
function main() {
    解除限制();
    if (config.contains("app")) {
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
    if (!String(engines.myEngine().getSource()).includes("remote:")) {
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

    let startTime = new Date().getTime();//程序开始时间
    LauchAPPName = appList[appIndex];
    app.launchApp(LauchAPPName);
    sleep(3000);
    ActiveInterface();
    if (text("每日攒点点券").exists()) {
        console.info("任务列表检测正常");
        sleep(500);
        //做任务
        RunAllTask();
        //收点券
        console.info("待检测点点券可收取情况");
        sleep(500);
        while (text("待收取").exists() | text("领取任务").exists() | text("继续完成").exists()) {//增加2次弹出的任务关键字，避免提前跳出循环
            let Buttons = text("我的点点券").findOne(5000).parent().parent().parent().children()
            if (Buttons.empty()) {
                console.info("无点点券收取");
            }
            else {
                for (var i = 1; i < Buttons.length - 2; i++) {
                    if (i == 1) {
                        console.info("发现可收取点点券");
                    }
                    let Button = Buttons[i]
                    ButtonText = Button.child(0).child(0).child(0).text()
                    if (ButtonText.match(/[+][1-9]0.*/)) {
                        console.log("第" + i + "次收点点券");
                        //有2组任务的时候，多停留1秒
                        if (textStartsWith("浏览2组").exists()) {
                            Button.click();
                            sleep(1000);
                        }
                        else {
                            Button.click();
                            sleep(100);
                        }
                        if (text("每日攒点点券").findOne(3000) == null) {
                            console.log("点击错误，返回");
                            back();
                            sleep(500);
                        }
                        else {
                            console.log("收取成功");
                            sleep(500);
                        }
                        //这组任务是收取之后才出现，故再做一次判断
                        if (text("领取任务").exists() | text("继续完成").exists()) {
                            console.info("发现任务");
                            RunAllTask();
                            console.info("继续收取");
                        }
                    }
                    sleep(500);
                }
            }
            sleep(1500);
        }
        console.info("点点券收取完毕");
        console.show();
    }
    console.info("当前账号所有任务已完成");
    back();
    sleep(1000);
    back();
    sleep(1000);
    home();
    sleep(500);
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
function randomClick(x, y) {
    var rx = random(0, 5);
    var ry = random(0, 5);

    click(x + rx, y + ry);
    sleep(2000);
    return true;
}

function RunAllTask() {
    if (text("领取任务").exists() | text("继续完成").exists()) {
        while (true) {
            if (textStartsWith("浏览2组会场").exists() && (textStartsWith("浏览2组会场").findOnce().parent().child(3).text() == "领取任务"
                | textStartsWith("浏览2组会场").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "浏览2组会场", 1);
            }
            else if (textStartsWith("浏览2组商品").exists() && (textStartsWith("浏览2组商品").findOnce().parent().child(3).text() == "领取任务"
                | textStartsWith("浏览2组商品").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "浏览2组商品", 1);
            }
            else if (textStartsWith("浏览2组活动").exists() && (textStartsWith("浏览2组活动").findOnce().parent().child(3).text() == "领取任务"
                | textStartsWith("浏览2组活动").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "浏览2组活动", 1);
            }
            else if (text("浏览精选商品").exists() && (text("浏览精选商品").findOnce().parent().child(3).text() == "领取任务"
                | text("浏览精选商品").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "浏览精选商品", 1);
            }
            else if (text("浏览精选活动3s").exists() && (text("浏览精选活动3s").findOnce().parent().child(3).text() == "领取任务"
                | text("浏览精选活动3s").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "浏览精选活动3s", 1);
            }
            else if (textStartsWith("关注浏览10s").exists() && (textStartsWith("关注浏览10s").findOnce().parent().child(3).text() == "领取任务"
                | textStartsWith("关注浏览10s").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "关注浏览10s", 2);
            }
            else if (text("领暴力好券").exists() && (text("领暴力好券").findOnce().parent().child(3).text() == "领取任务"
                | text("领暴力好券").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "领暴力好券", 3);
            }
            else if (text("逛领券15s").exists() && (text("逛领券15s").findOnce().parent().parent().child(3).text() == "领取任务"
                | text("逛领券15s").findOnce().parent().parent().child(3).text() == "继续完成")) {
                RunTask(2, "逛领券15s", 4);
            }
            else if (text("逛30s").exists() && (text("逛30s").findOnce().parent().parent().child(3).text() == "领取任务"
                | text("逛30s").findOnce().parent().parent().child(3).text() == "继续完成")) {
                RunTask(2, "逛30s", 4);
            }
            else if (text("点击“领券”").exists() && (text("点击“领券”").findOnce().parent().child(3).text() == "领取任务"
                | text("点击“领券”").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "点击“领券”", 4);
            }
            else if (text("点击券后9.9").exists() && (text("点击券后9.9").findOnce().parent().child(3).text() == "领取任务"
                | text("点击券后9.9").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "点击券后9.9", 4);
            }
            else if (text("点击“券后9.9”图标").exists() && (text("点击“券后9.9”图标").findOnce().parent().child(3).text() == "领取任务"
                | text("点击“券后9.9”图标").findOnce().parent().child(3).text() == "继续完成")) {
                RunTask(1, "点击“券后9.9”图标", 4);
            }
            else if (text("领200").exists() && (text("领200").findOnce().parent().parent().child(3).text() == "领取任务"
                | text("领200").findOnce().parent().parent().child(3).text() == "继续完成")) {
                RunTask(2, "领200", 4);
            }
            else if (text("领500").exists() && (text("领500").findOnce().parent().parent().child(3).text() == "领取任务"
                | text("领500").findOnce().parent().parent().child(3).text() == "继续完成")) {
                RunTask(2, "领500", 4);
            }
            else if (text("逛折学系频道10s").exists() && (text("逛折学系频道10s").findOnce().parent().child(3).text() == "领取任务"
                | text("逛折学系频道10s").findOnce().parent().child(3).text() == "继续完成")) {
                console.info("领取任务");
                text("逛折学系频道10s").findOnce().parent().child(3).click();
                sleep(11000);
                console.log("任务完成");
            }
            else if (text("领取任务").exists()) {
                console.info("领取任务");
                text("领取任务").findOnce().click();
                sleep(1000);
                console.log("任务完成");
            }
            sleep(1000);
            for (var i = 0; !text("每日攒点点券").exists() && i < 5; i++) {
                console.log("返回");
                back();
                sleep(2000);
                ActiveInterface();
                if (i == 5) {
                    console.log("无法返回任务界面,准备退出任务");
                    return;
                }
            }
            if (!text("领取任务").exists() && !text("继续完成").exists()) {
                //所有任务已完成，退出循环
                break;
            }
        }
    }
    console.info("所有任务已完成");
    sleep(500);
}
function RunTask(LevelNum, TaskName, KeyKind) {
    console.info("开始<" + TaskName + ">任务");
    if (LevelNum == 1) {
        textStartsWith(TaskName).findOnce().parent().child(3).click();
    }
    else if (LevelNum == 2) {
        textStartsWith(TaskName).findOnce().parent().parent().child(3).click();
    }
    else {
        console.error("任务参数异常，退出任务");
        return;
    }

    if (KeyKind == 1 | KeyKind == 2 | KeyKind == 3) {
        var TaskKey = TaskName + "（"
        className("android.view.View").textContains(TaskKey).waitFor();
        if (textContains("/10）").exists()) {
            var t = 10
        } else if (textContains("/9）").exists()) {
            var t = 9
        } else if (textContains("/8）").exists()) {
            var t = 8
        } else if (textContains("/7）").exists()) {
            var t = 7
        } else if (textContains("/6）").exists()) {
            var t = 6
        } else if (textContains("/5）").exists()) {
            var t = 5
        } else if (textContains("/4）").exists()) {
            var t = 4
        } else if (textContains("/3）").exists()) {
            var t = 3
        }
        if (KeyKind == 1) {
            for (var i = 0; i < t; i++) {
                console.log("第" + (i + 1) + "次浏览");
                className("android.view.View").textStartsWith(TaskKey).findOnce().parent().child(2).child(t - i - 1).click();
                sleep(3500);
                if (!className("android.view.View").textStartsWith(TaskKey).exists()) {
                    back();
                    sleep(1000);
                }
                for (var ii = 0; !className("android.view.View").textStartsWith(TaskKey).exists(); ii++) {
                    console.log("返回异常，再次尝试返回");
                    back();
                    sleep(2000);
                    if (ii > 5) {
                        console.error("任务异常，请重新运行脚本");
                        return;
                    }
                }
            }
            console.log("浏览完成");
        } else if (KeyKind == 2) {
            for (var i = 0; text("浏览并关注").exists(); i++) {
                console.log("第" + (i + 1) + "次关注浏览");
                className("android.view.View").textStartsWith(TaskKey).findOnce().parent().child(2).child(0).click();
                let Button = text("已完成浏览").findOnce(15000).parent();
                if (!Button) {
                    if (!className("android.view.View").textStartsWith(TaskKey).exists()) {
                        back();
                        sleep(1000);
                    }
                }
                else {
                    Button.click();
                }
                for (var ii = 0; !className("android.view.View").textStartsWith(TaskKey).exists(); ii++) {
                    console.log("返回异常，再次尝试返回");
                    back();
                    sleep(2000);
                    if (ii > 5) {
                        console.error("任务异常，请重新运行脚本");
                        return;
                    }
                }
                sleep(2000);
            }
            console.log("关注浏览完成");
        } else if (KeyKind == 3) {
            for (var i = 0; text("立即领取").exists(); i++) {
                console.log("第" + (i + 1) + "次领券");
                boundsX = text("立即领取").findOnce().bounds().centerX();
                boundsY = text("立即领取").findOnce().bounds().centerY();
                click(boundsX, boundsY);
                sleep(2000);
            }
            console.log("领券完成");
        }
        else {
            console.error("任务参数异常，退出任务");
            return;
        }
        //关闭浮窗
        console.log("关闭弹窗");
        for (var i = 0; !className("android.view.View").textStartsWith(TaskKey).exists(); i++) {
            console.log("关闭按钮异常，再次尝试返回");
            back();
            sleep(2000);
            if (i > 5) {
                console.error("任务异常，请重新运行脚本");
                return;
            }
        }
        let CloseButton = className("android.view.View").textStartsWith(TaskKey).findOnce().parent().child(0)
        if (CloseButton) {
            CloseButton.click();
            console.log("关闭成功");
            sleep(500);
        }
    }
    else if (KeyKind == 4) {
        console.log("等待跳转首页，可手动");
        if (text("去完成任务").findOne(3000) != null) {
            boundsX = text("去完成任务").findOnce().bounds().centerX();
            boundsY = text("去完成任务").findOnce().bounds().centerY();
            click(boundsX, boundsY);
            while (true) {
                if (className("android.widget.TextView").text("券后9.9").exists()) {
                    console.log("进入券后9.9");
                    className("android.widget.TextView").text("券后9.9").findOnce().parent().click();
                    sleep(1000);
                    break;
                } else if (className("android.widget.TextView").text("领券").exists()) {
                    console.log("进入领券");
                    className("android.widget.TextView").text("领券").findOnce().parent().click();
                    sleep(1000);
                    break;
                }
            }
        }
        console.log("等待任务完成")
        for (var i = 0; !text("已完成浏览").exists(); i++) {
            sleep(1000);
            if (i == 10 | i == 20 | i == 30) {
                console.log("已等待" + i + "秒");
            }
            if (i == 35) {
                console.log("等待任务完成标识");
            }
            if (text("已完成浏览").exists()) {
                console.log("已完成浏览");
                break;
            }
        }
        if (text("已完成浏览").exists()) {
            console.hide();
            boundsX = text("已完成浏览").findOnce().bounds().centerX();
            boundsY = text("已完成浏览").findOnce().bounds().centerY();
            click(boundsX, boundsY);
            sleep(1000);
        }
        sleep(1000);
        ActiveInterface();
    }
}
function ActiveInterface() {
    //活动界面判断&点点券签到
    for (var i = 0; !text("每日攒点点券").exists() && i < 10; i++) {
        if (i == 4 && app.getAppName(currentPackage()) == "京东") {
            console.log("尝试返回");
            back();
            sleep(500);
        }
        if (i == 6) {
            console.log("尝试重启APP");
            back();
            sleep(500);
            back();
            sleep(500);
            back();
            app.launchApp(LauchAPPName);
            console.log("等待任务检测……");
            sleep(3000);
        }
        if (i == 8 && className("android.view.View").desc("首页").exists()) {
            console.log("尝试刷新首页");
            boundsX = className("android.view.View").desc("首页").findOnce().bounds().centerX();
            boundsY = className("android.view.View").desc("首页").findOnce().bounds().centerY();
            click(boundsX, boundsY);
            sleep(3000);
        }
        if (i == 10) {
            console.log("无法找到活动界面,即将退出任务");
            return;
        }
        if (className("android.widget.TextView").text("领券").exists()) {
            console.info("进入领券");
            className("android.widget.TextView").text("领券").findOnce().parent().click();
            sleep(1000);
            while (text("签到领奖励").exists()) {
                console.hide();
                boundsX = text("签到领奖励").findOnce().bounds().centerX();
                boundsY = text("签到领奖励").findOnce().bounds().centerY();
                console.log("签到领奖励");
                click(boundsX, boundsY);
                console.log("签到完成");
                if (className("android.widget.ImageView").desc("关闭弹窗").findOne(2000) != null) {
                    console.log("关闭弹窗");
                    className("android.widget.ImageView").desc("关闭弹窗").findOne().click();
                    console.log("准备跳转");
                }
                else {
                    console.error("签到未成功，重新签到")
                }
                console.show();
            }
            if (className("android.view.View").desc("9.9下沉").exists()) {
                console.log("券后9.9");
                boundsX = className("android.view.View").desc("9.9下沉").findOnce().bounds().centerX();
                boundsY = className("android.view.View").desc("9.9下沉").findOnce().bounds().centerY();
                click(boundsX, boundsY);
                className("android.view.View").textStartsWith("抽奖次数：").waitFor();
                if (className("android.view.View").text("抽奖次数：0").exists()) {
                    console.log("抽奖次数已用完");
                }
                else if (text("点击拿奖励").exists()) {
                    console.log("点击拿奖励");
                    text("点击拿奖励").findOnce().click();
                    sleep(2000);
                    className("android.view.View").textStartsWith("抽奖次数：").waitFor();
                    for (var ii = 0; !className("android.view.View").text("抽奖次数：0").exists(); ii++) {
                        console.log("第" + (ii + 1) + "次抽奖");
                        textContains("抽奖次数").findOne().parent().click();
                        sleep(2000);
                        while (!text("收下奖品").exists()) {
                            if (text("再抽一次").exists()) {
                                console.log("没奖品，再抽一次");
                                text("再抽一次").findOne().click();
                                sleep(2000);
                                break;
                            }
                            console.log("等待开奖……");
                            sleep(2000);
                        }
                        if (text("收下奖品").exists()) {
                            console.log("收下奖品");
                            text("收下奖品").findOne().click();
                            sleep(2000);
                        }
                        if (ii == 3) {
                            console.log("抽奖次数已达上限");
                            break;
                        }
                        sleep(2000);
                    }
                    sleep(1000);
                    back();
                }
            }
            console.info("领券");
            sleep(1000);
            back();
            sleep(1000);
        }
        if (className("android.widget.TextView").text("券后9.9").exists()) {
            console.info("进入券后9.9");
            className("android.widget.TextView").text("券后9.9").findOnce().parent().click();
            console.log("等待加载……");
            className("android.view.View").textStartsWith("抽奖次数：").waitFor();
            if (className("android.view.View").text("抽奖次数：0").exists()) {
                console.log("抽奖次数已用完");
            }
            else if (text("点击拿奖励").exists()) {
                console.log("点击拿奖励");
                text("点击拿奖励").findOnce().click();
                sleep(2000);
                className("android.view.View").textStartsWith("抽奖次数：").waitFor();
                for (var ii = 0; !className("android.view.View").text("抽奖次数：0").exists(); ii++) {
                    console.log("第" + (ii + 1) + "次抽奖");
                    textContains("抽奖次数").findOne().parent().click();
                    sleep(2000);
                    while (!text("收下奖品").exists()) {
                        if (text("再抽一次").exists()) {
                            console.log("没奖品，再抽一次");
                            text("再抽一次").findOne().click();
                            sleep(2000);
                            break;
                        }
                        console.log("等待开奖……");
                        sleep(2000);
                    }
                    if (text("收下奖品").exists()) {
                        console.log("收下奖品");
                        text("收下奖品").findOne().click();
                        sleep(2000);
                    }
                    if (ii == 3) {
                        console.log("抽奖次数已达上限");
                        break;
                    }
                    sleep(2000);
                }
                sleep(1000);
                back();
            }
            console.info("领券");
            sleep(1000);
            back();
            sleep(1000);
        }
        if (desc("领券中心").exists()) {
            sleep(1000);
            while (text("签到领奖励").exists()) {
                console.hide();
                boundsX = text("签到领奖励").findOnce().bounds().centerX();
                boundsY = text("签到领奖励").findOnce().bounds().centerY();
                console.log("签到领奖励");
                click(boundsX, boundsY);
                if (className("android.widget.ImageView").desc("关闭弹窗").findOne(2000) != null) {
                    console.log("关闭弹窗");
                    console.log("签到完成");
                    className("android.widget.ImageView").desc("关闭弹窗").findOne().click();
                    console.log("准备跳转");
                }
                else {
                    console.error("签到未成功，重新签到")
                    swipe((device.width / 3) * 2, (device.height / 6), (device.width / 3) * 2, (device.height / 6) * 3, 500);  //向下滑动，确保是在顶部位置
                }
                console.show();
            }
            console.info("寻找点点券入口");
            if (desc("领券中心").findOne(3000) != null) {
                console.info("进入点点券");
                desc("领券中心").findOne().parent().child(3).click();
            }
            console.log("等待加载点点券……");
            console.log("如一直无响应，可手动进入活动，脚本将继续执行");
            for (var ii = 0; !text("每日攒点点券").exists(); ii++) {
                sleep(1500);
                if (text("每日攒点点券").exists()) {
                    break;
                }
                console.log("等待识别<每日攒点点券>");
                sleep(1500);
                if (ii == 2 && desc("领券中心").exists()) {
                    console.info("再次尝试进入点点券");
                    console.hide();
                    sleep(500);
                    boundsX = text("可兑").findOnce().bounds().centerX();
                    boundsY = text("可兑").findOnce().bounds().centerY();
                    click(boundsX, boundsY);
                    console.log("~~点击可兑红包");
                    sleep(500);
                    console.show();
                }
                if (ii > 5) {
                    console.error("关键节点识别超时，退出当前账号");
                    return;
                }
            }
        }
        if (!text("每日攒点点券").exists()) {
            console.log("未找到活动界面，请手动进入，如遮挡了入口，可关闭此悬浮窗");
            sleep(3000);
        }
    }
    console.show();
    if (text("每日攒点点券").exists() && (text("待领取").exists() | text("天天攒天天兑").exists())) {
        console.info("任务列表需要展开");
        if (text("待领取").exists()) {
            var KeyButton = text("待领取").findOne().parent();
        }
        else if (text("天天攒天天兑").exists()) {
            var KeyButton = text("天天攒天天兑").findOne().parent();
        }
        sleep(500);
        console.log("展开任务列表");

        KeyButton.click();
    }
}
