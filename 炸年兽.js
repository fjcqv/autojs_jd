/**
 * 2022炸年兽
 * 
 * Author: xsc
 * Date: 2022/1/9
 * Time: 11:52
 * Versions: 0.0.3
 * 电报: https://t.me/jdMemberCloseAccount
 * 支持京东、金融
 * 
 * v0.0.3
 * 修复入会一次错误就结束的bug，连续入会失败4次就不入了。
 */

// 需要完成的任务列表
var TASK_LIST = ["浏览并关注8s可得", "浏览8秒可得", "浏览8s可得", "成功入会", "种草城", "累计浏览", "浏览并关注可得",
    "浏览可得", "玩AR游戏可得", "去首页浮层进入", "首页品牌墙", "小程序", "每日6-9点打卡可得","去组队可得"];
//浏览就返回的任务
var BACK_LIST = ["浏览并关注可得", "浏览可得", "玩AR游戏可得","去组队可得"];
// 过渡操作
var PASS_LIST = ['请选择要使用的应用', '我知道了', '取消', "京口令已复制",];
// 判断停留时间
var JUDGE_TIME = 0;
// 定时器
var interval;
// 已完成序号
var finished_task_num = new Array();
// 当前序号
var current_task_num = 0;
// 浏览就返回标记
var isBackFlag = false;
// 小程序标记
var isXcx = false;
// 首页品牌墙标记
var isSYPPQ = false;
var jdAppName = "com.jingdong.app.mall";
var huodong_indexInParent_num_start = 17;
var huodong_indexInParent_num_end = 20;
var huodong_indexInParent_num = 18;
// 记录活动页面头部坐标
var headerXY;
var isRunXcx = false;
var ruhui_errtime = 0;


Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

init();


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


/**
 * 初始化
 */
function init() {

    // 子线程监听脚本
    threads.start(function () {
        events.setKeyInterceptionEnabled("volume_up", true);
        //启用按键监听
        events.observeKey();
        //监听音量上键按下
        events.onKeyDown("volume_up", function (event) {
            console.log("脚本退出!")
            exit();
        });
    });

    start();

    // 子线程开启计时
    threads.start(function () {

        if (interval == null) {
            // 开启计时器，进行卡顿计时
            // 启动定时器前，将计数器归为0
            JUDGE_TIME = 0;
            log("开启定时器");
            interval = setInterval(function () {
                JUDGE_TIME = JUDGE_TIME + 1;
            }, 1000);
        }
    });


    while (finished_task_num.length < 4) {
        try {
            transitioPperation();

            enterActivity();

            recoverApp();

            var flag = getNeedSelector();
            if (viewTask(flag) == 0)
                addMarketCar();
        } catch (e) {
            log(e);
        }


    }
    console.log("任务全部完成");

}



/**
 * 启动京东
 */
function start() {
    auto.waitFor();
    var autoRunJd = getPackageName("悟空分身") == null;
    if (autoRunJd && launch(jdAppName)) {
        console.info("启动京东APP");
    }
    else {
        console.info("存在分身，请手动启动京东");
    }

    isRunXcx = getPackageName("微信") != null;
    console.show();
}

/**
 * 进入做任务界面
 */
function enterActivity() {
    console.info("准备进入任务界面");
    if (!textContains("累计任务奖励").exists()) {
        sleep(4000);
        if (textContains("累计任务奖励").exists()) {
            console.info("已经在任务界面");
            sleep(1000);
            headerXY = id("a96").findOne().bounds();
        } else {
            if (desc("浮层活动").exists()) {
                console.info("点击浮层活动");
                var huodong = desc("浮层活动").findOne().bounds();
                randomClick(huodong.centerX(), huodong.centerY());
                sleep(1000);
            }

            // 获取进入做任务界面的控件
            if (id("homeBtnTeam").exists()) {
                //活动页面，不执行定时器
                JUDGE_TIME = 0;
                huodong_indexInParent_num_start = id("homeBtnTeam").findOnce().indexInParent() + 2;
                huodong_indexInParent_num_end = id("feedBottom").findOnce().indexInParent() + 4;
                if (huodong_indexInParent_num > huodong_indexInParent_num_end) {
                    huodong_indexInParent_num = huodong_indexInParent_num_start;
                }
                if (textContains("继续环游").exists()) {
                    console.log("继续环游");
                    textContains("继续环游").findOne().click();
                    sleep(2000);
                } else if (textContains("立即抽奖").exists()) {
                    console.log("关闭立即抽奖");
                    textContains("立即抽奖").findOne().parent().child(1).click();
                    sleep(2000);
                } else if (textContains("开启今日环游").exists()) {
                    console.log("开启今日环游");
                    textContains("开启今日环游").findOne().click();
                    sleep(2000);
                } else if (textContains("点我签到").exists()) {
                    console.log("点我签到");
                    textContains("点我签到").findOne().parent().click();
                    sleep(2000);
                    textContains("开心收下").waitFor();
                    textContains("开心收下").findOne().parent().click();
                    sleep(2000);
                } else if (text("开心收下开心收下").exists()) {
                    console.log("开心收下");
                    text("开心收下开心收下").findOne().click();
                    sleep(2000);
                } else if (textContains("开心收下").exists()) {
                    console.log("开心收下");
                    textContains("开心收下").findOne().parent().click();
                    sleep(2000);
                } else if (text("立即前往").exists()) {
                    console.log("前往签到");
                    textContains("立即前往").findOne().parent().click();
                    sleep(500);
                    console.log("点我签到");
                    textContains("点我签到").findOne().parent().click();
                    sleep(1000);
                    textContains("开心收下").waitFor();
                    textContains("开心收下").findOne().parent().click();
                    sleep(1000);
                } else if (textMatches(/00:.*后满|爆竹满了~~/).exists()) {
                    var clickCollect = textMatches(/00:.*后满|爆竹满了~~/).findOne();
                    clickCollect = clickCollect.parent();
                    clickCollect.parent().child(clickCollect.indexInParent() + 1).click();
                    sleep(5000);
                } else {
                    var button = className('android.view.View')
                        .depth(14)
                        .indexInParent(huodong_indexInParent_num)
                        .drawingOrder(0)
                        .clickable();
                    if (button.exists()) {

                        console.info("点击进入做任务界面", huodong_indexInParent_num)
                        var rect = button.findOne().bounds();
                        randomClick(rect.centerX(), rect.centerY());
                        sleep(1000);
                        headerXY = id("a96").findOne().bounds();

                    } else {
                        huodong_indexInParent_num = huodong_indexInParent_num + 1;
                        if (huodong_indexInParent_num > huodong_indexInParent_num_end) {
                            console.info("无法自动进入做任务界面，请手动进入！");
                            console.log(huodong_indexInParent_num_start, "", huodong_indexInParent_num_end)
                            huodong_indexInParent_num = huodong_indexInParent_num_start;

                        }
                    }
                }
            }

        }
        sleep(1000);
    }
}

/**
 * 去完成任务
 * @param {是否点击任务标识} flag 
 */
function viewTask(flag) {
    var res = 0;
    // 根据坐标点击任务，判断哪些需要进行
    sleep(2000);
    var timeout = 15;
    var timestart = new Date().getTime();
    console.info("开始时间:" + timestart)
    var timenow = new Date().getTime();
    while (true && flag) {
        timenow = new Date().getTime();
        if ((timenow - timestart) / 1000 > timeout) {
            console.info("结束时间:" + timenow)
            break;
        }
        if ((textStartsWith("获得").exists() && textEndsWith("爆竹").exists()) || text("已浏览").exists()) {
            console.info("任务完成，返回");
            viewAndFollow();
            sleep(500);
            // 重置计时
            JUDGE_TIME = 0;
            break;
        } else if (text("已达上限").exists()) {
            console.info("任务已达上限,切换已完成按钮");
            // 将当前任务序号添加到列表中，防止后续点到
            finished_task_num[finished_task_num.length] = current_task_num;
            viewAndFollow();
            sleep(500);
            // 重置计时
            JUDGE_TIME = 0;
            res = 1;
            break;
        } else if (textContains('会员授权协议').exists()) {
            if (ruhui()) {   //如果入会失败，则不再入会
                // 将当前任务序号添加到列表中，防止后续点到
                finished_task_num[finished_task_num.length] = current_task_num;
            }
            viewAndFollow();
            // 重置计时
            JUDGE_TIME = 0;
            break;
        }
        else if (textContains('我的特权').exists()) {
            console.info("会员已领取，返回");
            viewAndFollow();
            // 重置计时
            JUDGE_TIME = 0;
            break;
        } else if (textContains('当前页点击浏览4个').exists() || textContains('当前页浏览加购').exists()) {
            console.info("当前为加入购物车任务");
            // 重置计时
            JUDGE_TIME = 0;
            break;
        } else if (text("互动种草城").exists()) {
            console.info("当前为互动种草城任务");
            // 重置计时
            JUDGE_TIME = 0;
            if (interactionGrassPlanting()) {
                back();
                break;
            }
            break;
        } else if (text("到底了，没有更多了～").exists() && !text("消息").exists() && !text("扫啊扫").exists()
            && !(textStartsWith("当前进度").exists() && textEndsWith("10").exists())) {
            console.info("到底了，没有更多了～");
            sleep(1000);
            // 重置计时
            JUDGE_TIME = 0;
            var count = 0;
            while (count <= 5) {
                if (undefined === headerXY) {
                    headerXY = id("a96").findOne().bounds();
                }
                var rightx = headerXY.right;
                var righty = headerXY.bottom + 300;
                while (click(rightx, righty)) {
                    console.info("尝试点击坐标：", rightx, righty);
                    count = count + 1;
                    sleep(6000);
                    if (!text("到底了，没有更多了～").exists()) {
                        if (id("aqw").click()) {
                            sleep(2000);
                            console.info("尝试返回", count);
                            back();
                            break;
                        }
                    } else {
                        righty = righty + 50;
                    }
                    if (righty >= 1600) {
                        break;
                    }
                }
            }
            swipe(807, 314, 807, 414, 1);
            sleep(2000);
            break;
        } else if (text("消息").exists() && text("扫啊扫").exists()) {
            console.warn("因为某些原因回到首页，重新进入活动界面");
            enterActivity();
        } else if (text("天天都能领").exists()) {
            sleep(2000);
            console.info("天天都能领");
            // 重置计时
            JUDGE_TIME = 0;
            var button = className('android.view.View')
                .depth(16)
                .indexInParent(3)
                .drawingOrder(0)
                .clickable().findOne().bounds();
            if (randomClick(button.centerX(), button.centerY())) {
                sleep(1000);
                console.log("点我收下");
                if (back()) {
                    break;
                }
            }
        } else if (text("邀请新朋友 更快赚现金").exists()) {
            sleep(2000);
            console.info("邀请新朋友");
            // 重置计时
            JUDGE_TIME = 0;
            var button = className('android.view.View')
                .depth(20)
                .indexInParent(0)
                .drawingOrder(0)
                .clickable().find()[0].bounds();
            var y = button.bottom;
            while (click(button.right, y)) {
                if (!text("当前进度").exists()) {
                    back();
                    sleep(3000);
                    break;
                } else {
                    y = y + 100;
                }
            }
            break;
        } else if (text('京东11.11热爱环...').exists()) {
            console.info("下单任务，跳过");
            back();
        } else if (isBackFlag) {
            console.info("进入浏览就返回任务");
            //sleep(1000);
            viewAndFollow();
            JUDGE_TIME = 0;
            isBackFlag = false;
            break;
        } else if (isXcx) {
            console.info("进入小程序任务");
            // 重置计时
            JUDGE_TIME = 0;
            sleep(2000);
            back();
            sleep(2000);
            let trytime = 0;
            if (textContains("确定").exists()) {
                print("小程序签名未通过")
                textContains("确定").click()
                sleep(1000);
            }
            while (!textContains("当前进度").exists() && trytime < 5) {
                back();
                sleep(1000);
                trytime++;
            }

            isXcx = false;
            break;
        } else if (isSYPPQ) {
            console.info("进入首页品牌墙任务");
            sleep(1000);
            if (textContains("后满").exists()) {
                var task2 = textContains("后满").findOne().parent().parent()
                for (var i = 0; i < 3; i++) {
                    // 重置计时
                    JUDGE_TIME = 0;
                    console.log("第" + (i + 1) + "个店铺");
                    task2.child(task2.childCount() - 3).child(0).child(1).child(i).click();
                    sleep(3500);
                    for (var ii = 0; !textContains("后满").exists(); ii++) {
                        console.log("返回")
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
                isSYPPQ = false;
                console.info("任务已达上限,切换已完成按钮");
                // 将当前任务序号添加到列表中，防止后续点到
                finished_task_num[finished_task_num.length] = current_task_num;
                timestart = new Date().getTime();
                break;
            }
        } else {
            if (recoverApp()) {
                break;
            }
        }
    }

    if ((timenow - timestart) > (timeout * 1000)) {
        console.info("界面超时了")
        viewAndFollow();
    }
    return res;
}

/**
 * 加入购物车
 */
function addMarketCar() {
    if (textContains('当前页点击浏览4个').exists() || textContains('当前页浏览加购').exists()) {
        console.info("在加购页面");

        const productList = textContains('¥').find()
        console.info(productList.length);
        var count = 0;
        for (index = 0; index < productList.length; index++) {
            if (count == 4) {
                if (back()) {
                    sleep(3000)
                    count = 0;
                    break;
                }
            }
            if (productList[index].parent().parent().children()[4].click()) {
                // 重置计时
                JUDGE_TIME = 0;
                log("加购浏览任务:正在添加第" + (index + 1) + "个商品");
                sleep(2000);
                while (true) {
                    if (back()) {
                        count = count + 1;
                        sleep(2000);
                        if (textContains("当前页").exists()) {
                            break;
                        }
                    }
                }
            }
        }
    }

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
                    return true;
                }
            }
        }
    }

}

/**
 * 获取需要进行的控件
 * @returns 
 */
function getNeedSelector() {
    var allSelector = className('android.view.View')
        .depth(19)
        .indexInParent(3)
        .drawingOrder(0)
        .clickable()
        .find();

    for (let index = 0; index < allSelector.length; index++) {
        for (var i = 0; i < TASK_LIST.length; i++) {
            // 获取具有需要完成任务字符串的控件集合
            var list = allSelector[index].parent().findByText(TASK_LIST[i]);
            // 如果长度大于0则表示存在该控件
            if (list.size() > 0) {
                // 获取不在序列中的序号
                if (finished_task_num.indexOf(index) < 0) {
                    console.info("当前已完成序列：", finished_task_num)
                    current_task_num = index;
                } else {
                    continue;
                }

                // 如果是浏览就返回的任务，将标记设为true
                isBackFlag = BACK_LIST.indexOf(TASK_LIST[i]) >= 0;
                isSYPPQ = (TASK_LIST[i].indexOf("首页品牌墙") >= 0) ? true : false;
                // 如果是小程序任务，将小程序标记设为true
                isXcx = (TASK_LIST[i].indexOf("小程序") >= 0) ? true : false;
                if (isXcx && (currentPackage() != jdAppName || isRunXcx == false)) {
                    TASK_LIST.remove("小程序");
                    continue;
                }
                var rect = allSelector[current_task_num].bounds();
                if (textContains("累计任务奖励").exists()) {
                    console.info("开始完成序号：", current_task_num, ",关键字:", TASK_LIST[i]);
                    randomClick(rect.centerX(), rect.centerY());
                    return true;
                }
            }
        }
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
 * 自动判断程序是否卡顿，恢复方法
 * 判断依据：1.不在活动界面 2.停留某个界面长达30s
 * @returns 
 */
function recoverApp() {
    if (!text("当前进度").exists() && JUDGE_TIME > 30) {
        if (back()) {
            // 计时器重置
            JUDGE_TIME = 0;
            console.warn("停留某个页面超过30s,自动返回，重置定时器。");
            return true;
        }
    } else {
        return false;
    }
}

/**
 * 过渡操作
 */
function transitioPperation() {
    for (let index = 0; index < PASS_LIST.length; index++) {
        if (text(PASS_LIST[index]).exists()) {
            console.info("过渡操作：", PASS_LIST[index]);
            if (PASS_LIST[index].indexOf("请选择要使用的应用") >= 0) {
                back();
            } else if (text("查看同款").exists()) {
                text(PASS_LIST[index]).click();
            } else if (PASS_LIST[index].indexOf("已复制") >= 0) {
                className('android.widget.LinearLayout')
                    .depth(4)
                    .indexInParent(1)
                    .drawingOrder(2)
                    .clickable()
                    .findOne().click();
            } else {
                text(PASS_LIST[index]).click();
            }
            sleep(1000);
        }
    }
}

/**
 * 点击
 * @param {横坐标} x 
 * @param {纵坐标} y 
 */
function randomClick(x, y) {
    var rx = random(0, 5);
    var ry = random(0, 5);

    click(x + rx, y + ry);
    sleep(2000);
    return true;
}