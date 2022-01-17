/*
使用小X分身创建多个京东应用，应用名分别为京东2、京东3、京东4
脚本可以依次调用京东应用
 */
auto.waitFor();
console.show();
var appList = [];
var taskTimeLimit = 60;
var appIndex = 0;
var taskStatus = false;

main();
function main() {
    解除限制();
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
    //运行京东
    while (appIndex < appList.length) {

        var thread = threads.start(task);
        //等待该线程完成
        thread.join(taskTimeLimit * 1000);
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
    app.launchApp(appList[appIndex]);
    while (1) {
        if (desc("浮层活动").exists()) {
            console.log("点击浮层活动");
            var huodong = desc("浮层活动").findOne().bounds();
            randomClick(huodong.centerX(), huodong.centerY());
            sleep(1000);
        }
        if (textMatches(/[0-1]{2}:.*后满|爆竹满了~~/).exists()) {
            console.log("收集爆竹");
            var clickCollect = textMatches(/[0-1]{2}:.*后满|爆竹满了~~/).findOne();
            clickCollect.parent().parent().child(2).click();
            sleep(1000);
            for (var i = 0; i < 3; i++) {
                back();
                sleep(1000);
            }
            break;
        }
        sleep(500);
    }
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
function randomClick(x, y) {
    var rx = random(0, 5);
    var ry = random(0, 5);

    click(x + rx, y + ry);
    sleep(2000);
    return true;
}