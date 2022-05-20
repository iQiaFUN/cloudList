const axios = require('axios');
const path = require('path');
const tmpcfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'example.json')));

function checkFile(file, text) {
    if (NIL.IO.exists(path.join(__dirname, file)) == false) {
        NIL.IO.WriteTo(path.join(__dirname, file), text);
    }
}

checkFile("config.json", tmpcfg);
const cfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'config.json')));
const token = cfg.token;
const server = cfg.server;
const uuid = cfg.uuid;
const baseUrl = 'https://api.blackbe.xyz/openapi/v3';
const vcfg =  NIL._vanilla.cfg;


class CloudList extends NIL.ModuleBase{
    onStart(api){
        api.listen('onMainMessageReceived',(e)=>{
            let t = getText(e);
            let pt = t.split(' ');
            if(cfg.auto_CL && t == cfg.autoCMD){
                if(NIL._vanilla.wl_exists(e.sender.qq)){
                    let qq = e.sender.qq;
                    let xbox = NIL._vanilla.get_xboxid(qq);
                    checkPrivate(xbox,qq).then((r)=>{
                        if(r == false){
                            getData(xbox,qq).then((dt)=>{
                                uploadList(dt).then((response)=>{
                                    let data = response.data;
                                    if(data.status == 2000){
                                        e.reply(data.message)
                                    }else{
                                        e.reply(`上传失败\n原因${data.message}`)
                                    }     
                                }).catch((err)=>{
                                    if(err.response.status==403){
                                        e.reply(err.response.data.message)
                                    }
                                });
                            }).catch((err)=>{
                                console.log(err)
                            });
                        }else{
                            e.reply('玩家已存在于云端白名单中')
                        }
                    })             
                }else{
                    e.reply('你还没绑定xboxid!',true);
                }
            }
            switch(pt[0]){
                case cfg.upload:
                    if (NIL._vanilla.isAdmin(e.sender.qq) == false) {
                        e.reply(`你不是管理员，无法进行此操作！`);
                        return;
                    }
                    var at = getAt(e);
                    if (e.length != 0) {
                        at.forEach(element => {
                            if (NIL._vanilla.wl_exists(element)) {
                                let xbox = NIL._vanilla.get_xboxid(element);
                                checkPrivate(xbox,element).then((r)=>{
                                    if(r == false){
                                        getData(xbox,element).then((dt)=>{
                                            uploadList(dt).then((response)=>{
                                                let data = response.data;
                                                if(data.status == 2000){
                                                    e.reply(data.message)
                                                }else{
                                                    e.reply(`上传失败\n原因${data.message}`)
                                                }     
                                            }).catch((err)=>{
                                                if(err.response.status==403){
                                                    e.reply(err.response.data.message)
                                                }
                                            });
                                        }).catch((err)=>{
                                            console.log(err)
                                        });
                                    }else{
                                        e.reply('玩家已存在于云端白名单中')
                                    }
                                })
                            } else {
                                e.reply(`成员${element}还没有绑定白名单！`);
                            }
                        });
                    }
                    break
                case cfg.delete:
                    if (NIL._vanilla.isAdmin(e.sender.qq) == false) {
                        e.reply(`你不是管理员，无法进行此操作！`);
                        return;
                    }
                    var at = getAt(e);
                    at.forEach(element => {
                        if (!NIL._vanilla.wl_exists(element)) {
                            e.reply(`成员${element}还没有绑定白名单！`);
                        } else {
                            let xbox = NIL._vanilla.get_xboxid(element);
                            checkPrivate(xbox,element).then((r)=>{
                                if(r !== false){
                                    for(let i = 0 ; i < r.length ; i++){
                                        deletePrivate(r[i]).then((response)=>{
                                            let data = response.data;
                                            if(data.status == 2000){
                                                e.reply(`${r[i]}\n${data.message}`)
                                            }else{
                                                e.reply(`删除失败\n原因${data.message}`)
                                            }
                                        }).catch((err)=>{
                                            if(err.response.status==403){
                                                e.reply(err.response.data.message)
                                            }
                                        });
                                    }    
                                }
                            })
                        }
                    });
                    break
                default:
                    return
            }
        })
        if(cfg.auto_DEL){
            api.listen('onGroupMemberLeft',onLeft);
        }
        if (cfg.auto_UP) {
            api.listen('onMemberBinding',onBind);
        }
        api.listen('onMemberUnBinding',onUnBind);
    }

    onStop(){}
}


/**
 * 获取聊天文本
 */
function getText(e) {
    var rt = '';
    for (i in e.message) {
        switch (e.message[i].type) {
            case "text":
                rt += e.message[i].text;
                break;
        }
    }
    return rt;
}

function onBind(e){
    let xbox = e.xboxid;
    let qq = e.member.qq;
    //console.log(`${xbox} ${qq}`);
    checkPrivate(xbox,qq).then((r)=>{
        if(r == false){
            getData(xbox,qq).then((dt)=>{
                uploadList(dt).then((response)=>{
                    let data = response.data;
                    if(data.status == 2000){
                        NIL.bots.getBot(vcfg.self_id).sendGroupMsg(vcfg.group.main,`${data.message}`);
                    }else{
                        NIL.bots.getBot(vcfg.self_id).sendGroupMsg(vcfg.group.main,`上传失败\n原因${data.message}`);
                    }     
                }).catch((err)=>{
                    if(err.response.status==403){
                        NIL.bots.getBot(vcfg.self_id).sendGroupMsg(vcfg.group.main,`${err.response.data.message}`);
                    }
                });
            }).catch((err)=>{
                console.log(err);
            });
        }else{
            NIL.bots.getBot(vcfg.self_id).sendGroupMsg(vcfg.group.main,`玩家已存在于云端白名单中`);
        }
    })
}

function onLeft(e){
    if(e.group_id == vcfg.group.main && e.self_id == vcfg.self_id){
        let xbox = '';
        let qq = e.user_id;
        removeCloudList(xbox,qq);
    }
}

function onUnBind(e){
    let xbox = e.xboxid;
    let qq = e.member.qq;
    removeCloudList(xbox,qq);
}

function removeCloudList(xbox,qq){
    checkPrivate(xbox,qq).then((r)=>{
        if(r !== false){
            for(let i = 0 ; i < r.length ; i++){
                deletePrivate(r[i]).then((response)=>{
                    let data = response.data;
                    if(data.status == 2000){
                        NIL.bots.getBot(vcfg.self_id).sendGroupMsg(vcfg.group.main,`${r[i]}\n${data.message}`)
                    }else{
                        NIL.bots.getBot(vcfg.self_id).sendGroupMsg(vcfg.group.main,`删除失败\n原因${data.message}`)
                    }
                }).catch((err)=>{
                    if(err.response.status==403){
                        NIL.bots.getBot(vcfg.self_id).sendGroupMsg(vcfg.group.main,`${err.response.data.message}`)
                    }
                });
            }    
        }
    })
}
/**
 * getAt
 * @param {*} 
 * @returns 
 */
function getAt(e) {
    var at = [];
    for (i in e.message) {
        switch (e.message[i].type) {
            case "at":
                at.push(e.message[i].qq);
                break;
        }
    }
    return at;
};

/**
 * 输出data
 * @param {*} name 
 * @param {*} qq 
 * @param {*} phone 
 * @returns Promise对象
 */
function getData(name,qq,phone = 10000000000){
    const date = new Date();
    let Xuid = getXuid(name).then((res)=>{
        let xuid = res;
        return xuid
    }).catch((err)=>{
        console.log(err)
    });

    let data = Xuid.then((res)=>{
        let d = {
            black_id: uuid, 
            xuid: res, 
            name: name, 
            info: "云端白名单",
            server: server,
            time: DateFormat(date),
            level: 1,
            qq: qq,
            area_code: "+86",
            phone: phone
        }
        console.log(`data生成成功${JSON.stringify(d)}`);
        return d
    }).catch((err)=>{
        console.log(err)
    });
    return data
}

/**
 * 格式化时间
 */
function DateFormat(date){
	let d = date;
	let YYYY = d.getFullYear()
	let MM = numFormat(d.getMonth()+1);
	let dd = numFormat(d.getDate());
	let f = `${YYYY}-${MM}-${dd}`;
	return f;
}

/**
 * 数字补零
 * @param {*} a 
 * @returns 
 */
function numFormat(a){
	let b = 0;
	if(a < 10){
		b = `0${a}`;
	}else{
		b = `${a}`;
	}
	return b;
}

/**
 * Post 云端白名单
 * @param {*} data 
 * @returns 
 */
function uploadList(data){
    Author = `Bearer ${token}`;
    let r = axios(
        {
            method: "POST",
            headers: {
                "Authorization":Author
            },
            url:`${baseUrl}/private/repositories/piece/upload`,
            data: data
        }
    )
    return r
}

function deletePrivate(uuid){
    Author = `Bearer ${token}`;
    let r = axios(
        {
            method: "POST",
            headers: {
                "Authorization":Author
            },
            url:`${baseUrl}/private/repositories/piece/delete`,
            data: {
                piece_uuid: uuid
            }
        }
    )
    return r
}


/**
 * 检测私有库
 * @param {*} id 
 * @returns 
 */
function checkPrivate(name,qq){
    Author = `Bearer ${token}`;
    let Xuid = getXuid(name).then((res)=>{
        let xuid = res;
        console.log(xuid);
        return xuid
    }).catch((err)=>{
        console.log(err)
    });
    let r = Xuid.then((xuid)=>{
        
        return axios(
            {
                method: "POST",
                headers: {
                    "Authorization":Author
                },
                url:`${baseUrl}/check/private?name=${name}&qq=${qq}&xuid=${xuid}`,
                data: { repositories_uuid: [ uuid ] }
            }
        ).then((response)=>{
            const data = response.data;
            if (data.status == 2000) {
                let dt = data.data[0];
                if(dt.repo_success){
                    if(dt.exist){
                        let info = dt.info;
                        let tmp = [];
                        for(let i = 0 ; i < info.length;i++){
                            
                            tmp[i] = info[i].uuid;
                        }
                        console.log(tmp);
                        return tmp;
                    }else{
                        console.log('用户不在该云黑库');
                        return false
                    }
                }else{
                    console.log('查询仓库失败');
                    return false
                }
            } else {
                console.error(data.message);
                return false
            }
        })
    }).catch((err)=>{
        console.log(err)
    });
    return r
}

/**
 * 获取xuid
 * @param {*} id 
 * @returns 
 */
function getXuid(id){
    if(id == ''){
        id = 'blackbetest'
    }
    let r = new Promise((resolve,reject)=>{
        axios.get(`${baseUrl}/utils/xuid?gamertag=${id}`)
        .then((response)=>{
            const data = response.data;
            if (data.status == 2000) {
                console.log(data.message);
                resolve(data.data.xuid);
            } else {
                console.error(data.message);
                reject(data.message);
            }
        }).catch((err) => {
            console.log(err);
            reject(err);
        });
    })
    return r
}

module.exports = new CloudList;