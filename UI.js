"ui";
importClass(android.view.View);
importClass(android.widget.AdapterView);
importClass(android.database.sqlite.SQLiteDatabase);
var config = storages.create("jd");
var JD_DataSource = [];
var Exec_DataSource = [];
ui.statusBarColor("#FF4FB3FF");
ui.layout(
    <drawer id="drawer">
        <vertical h="*" w="*">
            <appbar>
                <toolbar id="toolbar" title="京东小工具" />
            </appbar>
            <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="5 5" elevation="1dp">
                <Switch id="autoService" w="*" checked="{{auto.service != null}}" textColor="#666666" text="无障碍服务" />
                <Switch id="floatingWindow" w="*" checked="{{floaty.checkPermission()}}" textColor="#666666" text="悬窗权限" />
                <View h="5" />
            </vertical>
            <horizontal margin="5 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                <View bg="#A0BFFF" h="*" w="10"  ></View>
                <vertical bg="#ffffff" padding="10 5 10 5" w="*" h="auto">
                    <text text="京东程序列表" />
                    <vertical bg="#ffffff" >
                        <list id="jdlist">
                            <checkbox id="app" checked="{{this.checked}}" text="{{this.title}}" textSize="16sp" />
                        </list>
                    </vertical>
                    <linear gravity="center">
                        <button margin="16" id="checkboxAll">全选</button>
                        <button margin="16" id="checkboxclear">全不选</button>
                    </linear>

                </vertical>
            </horizontal>
            <text text="操作" />
            <vertical bg="#ffffff" >
                <grid id="menu" spanCount='3'>
                    <horizontal bg="?selectableItemBackground" w="*" h="70">
                        <text textColor="black" w="*" h="70" gravity="center" textSize="20sp" text="{{this.title}} " />
                    </horizontal>
                </grid>
            </vertical>
        </vertical>

    </drawer>
);

activity.setSupportActionBar(ui.toolbar);
ui.toolbar.setupWithDrawer(ui.drawer);
ui.menu.on("item_click", item => {

    console.log(item);
    if (item.file) {
        engines.all().forEach(e => {
            if (String(e.source).indexOf(item.file) > -1)
                e.forceStop();
        });
        engines.execScriptFile(item.file);
    }

});

//进度条不可见
ui.run(() => {
    ui.autoService.setVisibility(View.GONE);
    if (floaty.checkPermission()) {
        ui.floatingWindow.setVisibility(View.GONE);
    }
    /**
     * 显示脚本
     */
    let dir = files.path("");
    let jsFiles = files.listDir(files.path(""), function (name) {
        return name.match(/[0-9]+\..*\.js/) != null && files.isFile(files.join(dir, name));
    });

    jsFiles.sort().forEach(a => {
        Exec_DataSource.push({ title: a.split('.')[1], file: a, icon: "@drawable/ic_android_black_48dp", })
    });
    ui.menu.setDataSource(Exec_DataSource);
    /**
     * 设置京东
     */
    var appList = [];
    var pm = context.getPackageManager()
    let list = pm.getInstalledApplications(0)
    for (let i = 0; i < list.size(); i++) {
        let p = list.get(i);
        if (p.label.match(/京东[0-9]*$/)) {
            appList.push(p.label);
        }
    }
    appList.sort().forEach(a => {
        JD_DataSource.push({ title: a, id: getPackageName(a), checked: true })

    });
    ui.jdlist.setDataSource(JD_DataSource);

});

// 用户勾选无障碍服务的选项时，跳转到页面让用户去开启 
//android.permission.SYSTEM_ALERT_WINDOW
ui.autoService.on("check", function (checked) {
    if (checked && auto.service == null) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    }
    if (!checked && auto.service != null) {
        auto.service.disableSelf();
    }
});
// 当用户回到本界面时，resume事件会被触发
ui.emitter.on("resume", function () {
    // 此时根据无障碍服务的开启情况，同步开关的状态
    ui.autoService.checked = auto.service != null;
});
/* 悬浮窗权限 */
ui.floatingWindow.on("check", function (checked) {
    // 用户勾选无障碍服务的选项时，跳转到页面让用户去开启
    if (auto.service != null) {
        if (checked) {
            int = app.startActivity({
                packageName: "com.android.settings",
                className: "com.android.settings.Settings$AppDrawOverlaySettingsActivity",
                data: "package:" + auto.service.getPackageName().toString()
            });
        }
    } else {
        toastLog("请先开启无障碍服务");
        ui.floatingWindow.checked = false;
    }
});
ui.checkboxAll.click(() => {
    JD_DataSource.forEach(a => a.checked = true);
    ui.jdlist.setDataSource(JD_DataSource);
    config.put("app",JD_DataSource.reduce((pre,cur) =>{if(cur.checked){pre.push(cur.title)}return pre;},[]))
    console.log(config.get("app"))
});
ui.checkboxclear.click(() => {
    JD_DataSource.forEach(a => a.checked = false);
    ui.jdlist.setDataSource(JD_DataSource);
    config.put("app",JD_DataSource.reduce((pre,cur) =>{if(cur.checked){pre.push(cur.title)}return pre;},[]))
});

ui.jdlist.on("item_bind", function (itemView, itemHolder) {
    itemView.app.on("check", function (checked) {
        let item = itemHolder.item;
        item.checked = checked;
        config.put("app",JD_DataSource.reduce((pre,cur) =>{if(cur.checked){pre.push(cur.title)}return pre;},[]))
    });
})