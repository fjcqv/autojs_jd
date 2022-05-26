/*
使用小X分身创建多个京东应用，应用名分别为京东2、京东3、京东4
脚本可以依次调用京东应用
 */

auto.waitFor();
console.show();
var debugMode = String(engines.myEngine().getSource()).includes("remote:");
var appList = [];
var config = storages.create("jd");
var taskTimeLimit = 600;
var appIndex = 0;
var TASK_LIST = [
    { match: /下单再得|参与城城|每邀1个/, isrun: false, func: nop },
    { match: /.*浏览.*s.*|.*浏览.*秒.*/, isrun: true, func: viewLongTime },
    { match: /去种草城逛大牌店铺/, isrun: true, func: interactionGrassPlanting },
    { match: /^浏览可得.*|玩AR游戏可得|每日6-9点打卡|去组队可得|浏览并关注可得/, isrun: true, func: viewAndFollow },
    { match: /累计浏览并加购/, isrun: true, func: addMarketCar },
    { match: /累计浏览.*个商品/, isrun: true, func: addMarketCar },
    { match: /成功入会/, isrun: true, func: joinMember },
    { match: /浏览.*个品牌墙店铺/, isrun: true, func: viewBottomShop },
    { match: /小程序/, isrun: true, func: viewSmallApp },

];

var PASS_LIST = ['请选择要使用的应用', '我知道了', '取消', "京口令已复制",];
var nowTime;

main();
function main() {
    解除限制();
    if (!requestSC()) {
        toastLog("请求截图权限失败")
        exit();
    }
    console.setSize(device.width / 2, device.height / 4);

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
    nowTime = new Date().getTime();
    while (run) {
        try {
            let page = getPage();
            console.log("page:" + page)
            let tmpTime = new Date().getTime()
            let timerPage = parseInt(tmpTime - nowTime)
            nowTime = tmpTime;
            // console.log(timerPage)
            switch (page) {
                case 1: runCheck = 0; break;
                case 2:
                    runCheck = 0;
                    console.log("成功进入活动界面"); activity();
                    break;
                case 3:
                    runCheck = 0;
                    console.log("检查可以做的任务");
                    if (debugMode) {
                        doTask()
                        break;
                    }
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

    if (text("累计任务奖励").exists()) {

        return 3;
    }
    if (text("分红：").exists()) {
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
        // while (textContains("继续环游 ").exists() | textContains("立即抽奖 ").exists() | textContains("开启今日抽奖 ").exists() | textContains("点我签到 ").exists() | textContains("开心收下 ").exists()) {
        //     sleep(1000);
        //     if (textContains("继续环游 ").exists()) {
        //         console.log("继续环游");
        //         textContains("继续环游 ").findOne().child(0).click();
        //         sleep(500);
        //     } else if (textContains("立即抽奖 ").exists()) {
        //         console.log("关闭立即抽奖");
        //         textContains("立即抽奖 ").findOne().parent().child(0).click();
        //         sleep(500);
        //     } else if (textContains("开启今日抽奖 ").exists()) {
        //         console.log("开启今日抽奖");
        //         textContains("开启今日抽奖 ").findOne().parent().child(0).click();
        //         sleep(1000);
        //     } else if (textContains("点我签到 ").exists()) {
        //         console.log("点我签到");
        //         textContains("点我签到 ").findOne().child(0).click();
        //         sleep(1000);
        //         textContains("开心收下 ").waitFor();
        //         textContains("开心收下 ").findOne().child(0).click();
        //         sleep(1000);
        //     } else if (textContains("开心收下 ").exists()) {
        //         console.log("开心收下");
        //         textContains("开心收下 ").findOne().child(0).click();
        //         sleep(1000);
        //     } else {
        //         console.log("暂无可处理弹窗");
        //         break;
        //     }
        //     sleep(1000);
        // }
        // console.log("如还有弹窗，请手动处理");
        // sleep(3000);

        // if (text("立即前往").exists()) {
        //     console.log("前往签到");
        //     textContains("立即前往").findOne().parent().click();
        //     sleep(500);
        //     console.log("点我签到");
        //     textContains("点我签到").findOne().parent().click();
        //     sleep(1000);
        //     textContains("开心收下").waitFor();
        //     textContains("开心收下").findOne().parent().click();
        //     sleep(1000);
        // }
        if (textMatches(/[0-2]{2}:.*后满|领取金币/).exists()) {
            console.log("收集金币");
            var clickCollect = textMatches(/[0-2]{2}:.*后满|领取金币/).findOne();;
            clickCollect.parent().parent().child(2).click();
            sleep(1000);
        }

        // if (text("放入我的＞我的优惠券").exists()) {
        //     text("放入我的＞我的优惠券").findOne().parent().parent().child(0).click();
        //     sleep(1000);
        // }
    }, 30 * 1000);
    if (pop == false) {
        back(); sleep(1000); return;
    }
    console.log("尝试点击任务");
    try {
        let hd = text("分红：").findOne(1000).parent().parent();
        hd.findOne(boundsInside(device.width / 2, 0, device.width, device.height).clickable()).click();
        if (text("累计任务奖励").findOne(2000) == null) {
            home();
            app.launchApp(appList[appIndex]);
        }
        if (text("累计任务奖励").findOne(2000) == null) {
            console.log("打开任务界面失败");
        }
    } catch (error) {
        console.log("打开任务界面失败");
    }

}
/*
做任务，做完返回0
*/
let prevTaskText1 = "";
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
        let task1color = images.pixel(task1img, task1b.left + task1b.width() / 16, task1b.top + task1b.height() / 2);
        //246,85,82 去完成 186,185,185 已完成 255,192,80 去领取
        //console.info(index, "识别任务<" + task1item.parent().child(1).text() + ">");
        //console.error(index, "识别任务状态:" + colors.toString(task1color));
        if (colors.isSimilar(task1color, "#b0a7a4", 20)) {
            //console.log("已完成")
            continue;
        }
        if (colors.isSimilar(task1color, "#f8a60c", 20)) {
            //console.log("去领取")
            taskState = 1;
            taskText1 = task1item.parent().child(1).text();
            taskText2 = task1item.parent().child(2).text();
            taskRect = task1item.bounds();
            break;
        }
        if (colors.isSimilar(task1color, "#fc6525", 20)) {
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
    //webview刷新bug修复
    if (prevTaskText1 == taskText1) {
        console.log("与上次任务一样，刷新webview");
        prevTaskText1 = "";
        home();
        app.launchApp(appList[appIndex]);
        return 1;
    }
    else {
        prevTaskText1 = taskText1;
    }
    //处理任务
    if (taskState == 1) {
        randomClick(taskRect.centerX(), taskRect.centerY());
    }
    else {

        console.log("开始任务：", taskText1);
        //console.log(taskRect)
        randomClick(taskRect.centerX(), taskRect.centerY());
        sleep(1000);
        if (!execFuncWait(task2.func, 35 * 1000)) {
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
        if ((textStartsWith("获得").exists() && textEndsWith("金币").exists()) || text("已浏览").exists()) {
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
    let allPinpai = textContains('!q70').find();
    if (allPinpai.length > 10) {
        for (var i = 5; i < 10; i++) {
            console.log("第" + (i - 4) + "个店铺");
            allPinpai[i].parent().parent().click();
            sleep(3500);
            for (var ii = 0; !textContains('!q70').exists(); ii++) {
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
    let banner = textContains('喜欢').findOne(10000)
    if (!banner) {
        console.log('未能进入店铺列表。返回。')
    } else {
        let c = banner.text().match(/(\d)\/(\d*)/)
        if (!c) {
            c = 4 // 进行4次
        } else {
            c = c[2] - c[1]
        }
        sleep(2000)
        console.log('进行', c, '次')
        let like = textContains('喜欢').boundsInside(1, 0, device.width, device.height).findOnce()
        if (!like) {
            console.log('未能找到喜欢按钮。返回。')
        } else {
            let bound = [like.bounds().centerX(), like.bounds().centerY()]
            console.log('喜欢按钮位于', bound)
            for (let i = 0; i < c; i++) {
                click(bound[0], bound[1])
                console.log('浏览店铺页')
                sleep(8000)
                console.log('返回')
                back()
                sleep(5000)
                let r = textContains('喜欢').findOnce()
                if (!r) {
                    back()
                    sleep(5000)
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
    let check = textMatches(/.*确认授权即同意.*|.*我的特权.*|.*立即开卡.*/).findOne(8000)
    if (!check) {
        console.log('无法找到入会按钮，判定为已经入会');

    } else if (check.text().match(/我的特权/)) {
        console.log('已经入会，返回');
    }
    else {
        //入会操作
        ruhui(check)
    }

    viewAndFollow();
}
function ruhui(check) {
    sleep(2000);
    if (check.text().match(/立即开卡/)) {
        let btn = check.bounds()
        console.log('即将点击开卡，自动隐藏控制台')
        console.hide()
        sleep(500)
        click(btn.centerX(), btn.centerY())
        sleep(500)
        check = textMatches(/.*确认授权即同意.*/).findOne(8000)
        sleep(2000)
    }

    if (!check) {
        console.log('无法找到入会按钮弹窗，加载失败')
        return false
    }
    if (check.indexInParent() == 6) {
        check = check.parent().child(5).bounds()
    } else {
        check = check.parent().parent().child(5).bounds()
    }

    console.log('即将勾选授权，自动隐藏控制台', check)
    console.hide()
    sleep(500)
    click(check.centerX(), check.centerY())
    sleep(500)
    try {
        let j = textMatches(/^确认授权(并加入店铺会员)*$/).findOne(8000).bounds()
        if (!j) {
            console.log('无法找到入会按钮，失败')
            return false
        }
        click(j.centerX(), j.centerY())
        sleep(500)
        console.show()
        return true
    } catch (err) {
        console.log('入会任务出现异常！停止完成入会任务。', err)
        join = 0
        sleep(500)
        console.show()
        return false
    }
}