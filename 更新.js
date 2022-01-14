function github(githubfile, savefile) {
    let url = "https://raw.fastgit.org/" + githubfile;
    res = http.get(url);
    if (res.statusCode != 200) {
        toast("请求失败");
    }
    files.writeBytes("/sdcard/脚本/" + savefile, res.body.bytes());
    toast("下载成功");
}
github("fjcqv/autojs_jd/main/助力.js", "助力");
github("fjcqv/autojs_jd/main/炸年兽.js", "炸年兽");