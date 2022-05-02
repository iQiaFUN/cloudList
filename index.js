const axios = require('axios');
const path = require('path');
const cfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'config.json')));
const token = cfg.token;
const server = cfg.server;
const uuid = cfg.uuid;
const baseUrl = 'https://api.blackbe.xyz/openapi/v3';
const cmd = cfg.cmd;


function onStart(api){
    api.listen('onMainMessageReceived',(e)=>{
        let t = getText(e);
		if(t == cmd){
			if(NIL._vanilla.wl_exists(e.sender.qq)){
				//copy于vanilla/onMain.js 214行
                let qq = e.sender.qq;
				let xbox = NIL._vanilla.get_xboxid(qq);
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
				e.reply('你还没绑定xboxid!',true);
			}
		}
    })
}

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

function DateFormat(date){
	let d = date;
	let YYYY = d.getFullYear()
	let MM = numFormat(d.getMonth()+1);
	let dd = numFormat(d.getDate());
	let f = `${YYYY}-${MM}-${dd}`;
	return f;
}

function numFormat(a){
	let b = 0;
	if(a < 10){
		b = `0${a}`;
	}else{
		b = `${a}`;
	}
	return b;
}

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



function getXuid(id){
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

module.exports = {
    onStart,
    onStop(){}
};