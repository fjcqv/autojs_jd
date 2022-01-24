/*
使用小X分身创建多个京东应用，应用名分别为京东2、京东3、京东4
脚本可以依次调用京东应用
 */

auto.waitFor();
console.show();
var config = storages.create("jd");
var appList = [];
var taskTimeLimit = 600;
var appIndex = 0;
var TASK_LIST = [
    { match: /.*浏览.*s.*|.*浏览.*秒.*/, isrun: true, func: viewLongTime },
    { match: /去种草城逛大牌店铺/, isrun: true, func: interactionGrassPlanting },
    { match: /^浏览可得.*|玩AR游戏可得|每日6-9点打卡|去组队可得|浏览并关注可得/, isrun: true, func: viewAndFollow },
    { match: /累计浏览并加购/, isrun: true, func: addMarketCar },
    { match: /累计浏览.*个商品/, isrun: true, func: addMarketCar },
    { match: /成功入会/, isrun: true, func: joinMember },
    { match: /浏览.*个品牌墙店铺/, isrun: true, func: viewBottomShop },
    { match: /小程序/, isrun: true, func: viewSmallApp },
    { match: /下单商品可得|参与城城|每邀1个/, isrun: false, func: nop },
];

var PASS_LIST = ['请选择要使用的应用', '我知道了', '取消', "京口令已复制",];


main();
function main() {
    解除限制();
    if (!requestSC()) {
        toastLog("请求截图权限失败")
        exit();
    }
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

    //运行京东
    while (appIndex < appList.length) {

        if (execFuncWait(task, taskTimeLimit * 1000)) {
            appIndex += 1;
        } else {
            threads.shutDownAll();
            console.error("运行失败，重新运行");
            for (var i = 0; i < 3; i++) {
                back();
                sleep(1000);
            }
        }
    }
    toast("任务完成");
    appList.forEach(a => { stopApp(a); sleep(1000) });

    // recents();
    // var w = id("clear_all_recents_image_button").findOne(6000);
    // //如果找到控件则点击
    // if (w != null) {
    //     w.click();
    // } else {
    //     //否则提示没有找到
    //     toast("一键清理失败");
    // }
}

function task() {
    let packageName = app.getPackageName(appList[appIndex]);
    console.info("开始运行", appList[appIndex]);
    home();
    app.launchApp(appList[appIndex]);
    let startTime = new Date().getTime();//程序开始时间
    let run = true;
    let doTaskFaild = 0;
    let runCheck = 0;
    while (run) {
        try {
            switch (getPage()) {
                case 1: runCheck = 0; break;
                case 2:
                    runCheck = 0;
                    console.log("成功进入活动界面"); activity();
                    break;
                case 3:
                    runCheck = 0;
                    console.log("检查可以做的任务");
                    if (doTask()) { doTaskFaild = 0; }
                    else { doTaskFaild++; if (doTaskFaild > 3) run = false; }
                    break;
                default:
                    if (currentPackage() != packageName) {
                        runCheck++;
                        if (runCheck > 30) {
                            console.error("出现异常，重启应用");
                            stopApp(appList[appIndex]);
                            app.launchApp(appList[appIndex]);
                        }
                    }
                    break;
            }
            sleep(1000);
        } catch (error) {
            console.error($debug.getStackTrace(error));
            //stopApp(appList[appIndex]);
            threads.shutDownAll();
        }
    }
    let endTime = new Date().getTime();
    console.log("运行结束,共耗时" + (parseInt(endTime - startTime)) / 1000 + "秒");
}

/**
 * 进入做任务界面
 */
function getPage() {

    if (textContains("累计任务奖励").exists()) {

        return 3;
    }
    if (text("集爆竹炸年兽集爆竹炸年兽").exists()) {
        return 2;
    }
    if (desc("浮层活动").exists()) {
        console.info("点击浮层活动");
        var huodong = desc("浮层活动").findOne().bounds();
        randomClick(huodong.centerX(), huodong.centerY());
        sleep(150);
        randomClick(huodong.centerX(), huodong.centerY());
        return 1;
    }
    return 0;
}
/**
 * 进入活动页面，处理弹窗和打开任务界面
 */
function activity() {
    console.log("成功进入活动界面");
    console.log("等待加载弹窗……");
    let pop = execFuncWait(function () {
        while (textContains("继续环游").exists() | textContains("立即抽奖").exists() | textContains("开启今日环游").exists() | textContains("点我签到").exists() | textContains("开心收下").exists()) {
            sleep(1000);
            if (textContains("继续环游").exists()) {
                console.log("继续环游");
                textContains("继续环游").findOne().click();
                sleep(500);
            } else if (textContains("立即抽奖").exists()) {
                console.log("关闭立即抽奖");
                textContains("立即抽奖").findOne().parent().child(1).click();
                sleep(500);
            } else if (textContains("开启今日环游").exists()) {
                console.log("开启今日环游");
                textContains("开启今日环游").findOne().click();
                sleep(1000);
            } else if (textContains("点我签到").exists()) {
                console.log("点我签到");
                textContains("点我签到").findOne().parent().click();
                sleep(1000);
                textContains("开心收下").waitFor();
                textContains("开心收下").findOne().parent().click();
                sleep(1000);
            } else if (text("开心收下开心收下").exists()) {
                console.log("开心收下");
                text("开心收下开心收下").findOne().click();
                sleep(1000);
            } else if (textContains("开心收下").exists()) {
                console.log("开心收下");
                textContains("开心收下").findOne().parent().click();
                sleep(1000);
            } else {
                console.log("暂无可处理弹窗");
                break;
            }
            sleep(1000);
        }
        console.log("如还有弹窗，请手动处理");
        sleep(3000);

        if (text("立即前往").exists()) {
            console.log("前往签到");
            textContains("立即前往").findOne().parent().click();
            sleep(500);
            console.log("点我签到");
            textContains("点我签到").findOne().parent().click();
            sleep(1000);
            textContains("开心收下").waitFor();
            textContains("开心收下").findOne().parent().click();
            sleep(1000);
        }
        else if (textMatches(/00:.*后满|爆竹满了~~/).exists()) {
            console.log("收集爆竹");
            var clickCollect = textMatches(/00:.*后满|爆竹满了~~/).findOne();
            clickCollect.parent().parent().child(2).click();
            sleep(5000);
        }

        if (text("放入我的＞我的优惠券").exists()) {
            text("放入我的＞我的优惠券").findOne().parent().parent().child(0).click();
            sleep(1000);
        }
    }, 30 * 1000);
    if (pop == false) {
        back(); sleep(1000); return;
    }
    console.log("尝试点击任务");
    let huodong_indexInParent_num_start = 18;
    let huodong_indexInParent_num_end = 25;
    try {
        var hd = text("集爆竹炸年兽集爆竹炸年兽").findOne(1000).parent().parent();
        for (var i = 0; i < hd.children(); i++) {
            if (hd.child(i).id() == "homeBtnTeam") {
                huodong_indexInParent_num_start = i + 2;
                huodong_indexInParent_num_end = i + 4;
                if (huodong_indexInParent_num > huodong_indexInParent_num_end) {
                    huodong_indexInParent_num = huodong_indexInParent_num_start;
                }
                break;
            }
        }
        let huodong_indexInParent_num = huodong_indexInParent_num_start;
        for (var i = 0; !text("累计任务奖励").exists(); huodong_indexInParent_num++) {
            let button = className('android.view.View')
                .depth(14)
                .indexInParent(huodong_indexInParent_num)
                .drawingOrder(0)
                .clickable();
            if (button.exists()) {
                console.info("尝试点击任务", huodong_indexInParent_num)
                var rect = button.findOne().bounds();
                randomClick(rect.centerX(), rect.centerY());
                sleep(1000);
            }
            sleep(1000);
            if (i >= 10) {
                console.log("未按时打开任务列表，退出当前任务");
                return;
            }
        }

    } catch (error) {
        console.log("打开任务界面失败");
    }

}
/*
做任务，做完返回0
*/
function doTask() {
    let index;
    let taskState = 0;
    let taskText1 = "";
    let taskText2 = "";
    let taskRect;
    let task2;
    if (!text("累计任务奖励").exists()) return 1;
    let allSelector = className('android.view.View').depth(19).indexInParent(3).drawingOrder(0).clickable().find();
    let task1img = captureScreen();
    for (index = 0; index < allSelector.length; index++) {
        let task1item = allSelector[index];
        if (task1item.parent().child(0).className() != "android.widget.Image") continue;
        let task1b = task1item.bounds();
        let task1color = images.pixel(task1img, task1b.left + task1b.width() / 8, task1b.top + task1b.height() / 2);
        //246,85,82 去完成 186,185,185 已完成 255,192,80 去领取
        // console.info(index,"识别任务<" + task1item.parent().child(1).text() + ">");
        // console.error(index,"识别任务状态:" + colors.toString(task1color) );
        if (colors.isSimilar(task1color, "#BAB9B9", 20)) {
            //console.log("已完成")
            continue;
        }
        if (colors.isSimilar(task1color, "#FFC050", 20)) {
            //console.log("去领取")
            taskState = 1;
            taskText1 = task1item.parent().child(1).text();
            taskText2 = task1item.parent().child(2).text();
            taskRect = task1item.bounds();
            break;
        }
        if (colors.isSimilar(task1color, "#f68550", 20)) {
            //去完成
            //console.log("去完成")
            taskText1 = task1item.parent().child(1).text();
            taskText2 = task1item.parent().child(2).text();
            let findText = taskText2 + taskText1;
            taskRect = task1item.bounds();
            task2 = TASK_LIST.find(s => { return s.match.exec(findText) != null });
            if (task2) {
                if (task2.isrun) break;
                continue;

            } else {
                console.error("没有处理：", taskText2);
            }
        }
    }
    task1img.recycle();
    //任务完成
    if (index == allSelector.length) return 0;
    if (taskState == 1) {
        randomClick(taskRect.centerX(), taskRect.centerY());
    }
    else {
        //
        console.log("开始任务：", taskText1);
        randomClick(taskRect.centerX(), taskRect.centerY());
        sleep(1000);
        if (!execFuncWait(task2.func, 30 * 1000)) {
            console.error("运行失败:", taskText1);
            viewAndFollow();
        }
    }
    return 1;

}
/**
 * 开线程运行函数，超时退出，返回运行结果
 * @param {*} func 
 * @param {*} timeout 
 */
function execFuncWait(func, timeout) {
    let thread = threads.start(func);
    //等待该线程完成
    thread.join(timeout);
    if (thread.isAlive()) {
        thread.interrupt();
        return false;
    }
    return true;
}
/**
 * 解除限制,针对pro
 */
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
/**
 * 自动允许截图权限
 */
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
    sleep(1000);
}
/**
 * 自动允许截图权限 
 */
function requestSC(landscape) {
    try {
        screen = captureScreen();
        return true;
    } catch (error) {
        let countDown = new java.util.concurrent.CountDownLatch(1);
        let confirmWaitingThread = threads.start(function () {
            let matchRegex = new RegExp("START NOW|立即开始|允许");
            let confirmWidget = textMatches(matchRegex).findOne();
            if (confirmWidget) {
                console.info('自动允许截图权限');
                sleep(200);
                click(confirmWidget.bounds().centerX(), confirmWidget.bounds().centerY());
            } else {
                console.error('未找到允许截图按钮');
                countDown.countDown();
            }
        })
        let requestSuccess = false;
        let requestThread = threads.start(function () {
            requestSuccess = requestScreenCapture(landscape);
            countDown.countDown();
        })
        let waitResult = countDown.await(15, java.util.concurrent.TimeUnit.SECONDS);
        if (!waitResult) {
            console.warn('请求截屏权限超时');
        }
        console.log('请求截屏权限结束：' + requestSuccess);
        confirmWaitingThread.interrupt();
        requestThread.interrupt();
        return requestSuccess;
    }
}
/**
 * 返回
 */
function viewAndFollow() {
    trytime = 0;
    while (!textContains("当前进度").exists() && trytime < 10) {
        back();
        sleep(1000);
        trytime++;
    }
}
/**
 * 无操作
 */
function nop() {

}
/**
 * 8秒浏览任务
 */
function viewLongTime() {
    while (1) {
        if ((textStartsWith("获得").exists() && textEndsWith("爆竹").exists()) || text("已浏览").exists()) {
            console.info("任务完成，返回");
            viewAndFollow(); sleep(500);
            break;
        } else if (text("已达上限").exists()) {
            viewAndFollow(); sleep(500);
            break;
        }
    }
}
/**
 * 底部品牌墙店铺
 */
function viewBottomShop() {
    console.info("进入首页品牌墙任务");
    sleep(1000);
    var allPinpai = className('android.widget.Image')
        .depth(19)
        .indexInParent(0)
        .drawingOrder(0)
        .find();
    if (allPinpai.length > 10) {
        for (var i = 0; i < 3; i++) {
            console.log("第" + (i + 1) + "个店铺");
            allPinpai[i].parent().parent().click();
            sleep(3500);
            for (var ii = 0; !text("集爆竹炸年兽集爆竹炸年兽").exists(); ii++) {
                console.log("返回");
                back();
                sleep(1500);
                if (ii > 4) {
                    console.log("返回活动界面，退出当前任务");
                    return;
                }
            }
        }
        back();
        sleep(1000);
    }
}
/*
小程序
*/
function viewSmallApp() {
    let cnt = 0;
    while (1) {
        if (text("使用以下方式打开").exists()) {
            text("微信").findOne().parent().click();
            sleep(1000);
            cnt = 0;
        }
        if (textContains("应用包名签名信息校验不通过").exists()) {
            text("确定").findOne().click();
            cnt = 0;
        }
        cnt++;
        if (cnt > 5) break;
        sleep(1000);
        console.log("微信小程序:", 5 - cnt);
    }
    viewAndFollow();
}
/**
 * 互动种草城
 * @returns 
 */
function interactionGrassPlanting() {
    var count = 0;
    while (true) {
        if (className('android.view.View').indexInParent(4).depth(14).findOne().click()) {
            // 重置计时
            JUDGE_TIME = 0;
            console.info("去逛逛");
            sleep(2000);
            if (back()) {
                sleep(2000);
                count = count + 1;
                if (count == 3) {
                    break;
                }
            }
        }
    }
    viewAndFollow();
}

/**
 * 加入购物车
 */
function addMarketCar() {
    sleep(1000);
    textMatches(/当前页[浏览加购|点击浏览].*个.*/).waitFor();

    const productList = textContains('¥').find();
    console.info("当前商品数量：", productList.length);
    var count = 0;
    for (index = 0; index < 4; index++) {
        if (productList[index].parent().parent().children()[4].click()) {
            console.log("第" + (index + 1) + "个商品");
            sleep(1000);
            for (var ii = 0; !textMatches(/当前页[浏览加购|点击浏览].*个.*/).exists(); ii++) {
                if (ii == 0) {
                    console.log("返回");
                } else {
                    console.log("再次返回");
                }
                back();
                sleep(2000);
                if (ii > 4) {
                    console.error("任务异常，退出当前账号");
                    return;
                }
            }
        }
    }
    viewAndFollow();
}
/*
入会
 */
function joinMember() {
    textMatches(/.*会员授权协议.*|我的特权/).findOne(8000);
    if (textContains('会员授权协议').exists()) {
        ruhui();
    }
    else if (textContains('我的特权').exists()) {
        console.info("会员已领取，返回");
    }

    viewAndFollow();
}
/**
 * 入会操作
 * @returns 返回 0:成功  1:失败
 */
function ruhui() {
    var ruhui_errtimemax = 3;

    headerXY = textContains('确认授权').findOne().parent().children()[5].bounds()
    var rightx = headerXY.centerX();
    var righty = headerXY.bottom - 5;
    //console.info("x="+ rightx + "  y=" + righty)
    textContains('确认授权').findOne().parent().children()[5].click()
    click(rightx, righty)
    sleep(500)
    click(rightx + 100, righty + 100)
    sleep(1000)

    if (textContains('确认授权').exists()) {
        console.info("入会失败");
        ruhui_errtime++;
        if (ruhui_errtime >= ruhui_errtimemax) {
            ruhui_errtime = 0;
            console.info("超过" + ruhui_errtimemax + "次，不再入会");
            return 1;
        } else {
            console.info(ruhui_errtime + "次");
            return 0;
        }

        return 1;
    } else {
        back();
        sleep(1000)
        if (textContains('累计任务').exists()) {
            console.info("入会成功");
            ruhui_errtime = 0;
            return 0;
        } else {
            console.info("入会失败");
            ruhui_errtime++;
            if (ruhui_errtime >= ruhui_errtimemax) {
                ruhui_errtime = 0;
                console.info("超过" + ruhui_errtimemax + "次，不再入会");
                return 1;
            } else {
                console.info(ruhui_errtime + "次");
                return 0;
            }
        }
    }
}