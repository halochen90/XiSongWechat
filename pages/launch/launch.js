// launch.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    birthday:'2017-9-1',
    days:0
  },
  onShareAppMessage: function () {
    return {
      title: '宝宝在这呢，快来看看吧^_^',
      path: '/pages/launch/launch'
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.checkSession({//检查当前是否是登录态
      success: function () {
        console.log("当前是登录态");
      },
      fail: function () {
        //调用登录接口
        wx.login({
          success: function (loginRes) {
            //发起请求获取登录态
            console.log("code:" + loginRes.code);
            saveSession(loginRes.code);
          }
        })
      }
    })

    getBirthday(that);
  },

  watchPhoto: function(){
    var that = this;
    //获取本地缓存的session
    wx.getStorage({
      key: 'session',
      success: function(res) {
        console.log("本地缓存session:"+res.data);
        authSession(res.data);
      },
      fail: function(){
          console.log("session is null");
          wx.login({
            success: function (loginRes) {
              //发起请求获取登录态
              console.log("code:" + loginRes.code);
              saveSession(loginRes.code);
              wx.redirectTo({
                url: '/pages/auth/auth',
              })
            },
            fail:function(res){
              console.log("login fail",res);
            }
          })
      }
    })
   
  }
})

function dateDiff(sDate1, sDate2) {    //sDate1和sDate2是2002-12-18格式  

  var aDate, oDate1, oDate2, iDays;
  aDate = sDate1.split("-");  
  oDate1 = new Date(aDate[0] + "/" + aDate[1] + "/" + aDate[2])    //2002-12-18格式 
  aDate = sDate2.split("-")
  oDate2 = new Date(aDate[0] + '/' + aDate[1] + '/' + aDate[2]) 
  iDays = parseInt(Math.abs(oDate1 - oDate2) / 1000 / 60 / 60 / 24)    //把相差的毫秒数转换为天数 
  
  return iDays;
}

//发送请求获取记录
function getBirthday(that) {
  wx.request({
    url: app.REQUEST_URL + '/api/information/birthday',
    method: 'GET',
    data: {},
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      //获取破壳天数
      var d = new Date();
      var today = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
      var birthday = res.data.birthday;
      console.log("birthday:"+birthday);
      var num = dateDiff(birthday, today);
      that.setData({
        days: num
      })
      //设置全局变量days
      app.days = num;
    }
  })
}

function saveSession(code) {
  wx.request({
    url: app.REQUEST_URL + '/api/information/session',
    method: 'GET',
    data: { "code": code },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      console.log("请求返回的session:" + res.data.session);
      //把session存到本地
      wx.setStorage({
        key: 'session',
        data: res.data.session,
      })   
    }
  })
}

function authSession(session){
  console.log("authSession:",session)
  wx.request({
    url: app.REQUEST_URL + '/api/information/authSession',
    method: 'GET',
    data:{"session":session},
    header:{
      'content-type':'application/json'
    },
    success:function(res){
      if(res.data.result){//验证成功，已授权
        wx.switchTab({
          url: '/pages/index/index'
        })
      }else{//验证失败,未授权
        if (res.data.isAuth == 0){
          console.log("身份验证失败，跳转到验证页面");
          wx.navigateTo({
            url: '/pages/auth/auth'
          }) 
        }else if(res.data.isAuth == -1){
            wx.showToast({
              title: '很遗憾，您的授权申请已被拒绝',
            })
        }else if(res.data.isAuth == -2){
          wx.showToast({
            title: '很遗憾，您没有权限访问其他页面',
          })
        }else{//session不匹配，重新登录
          wx.login({
            success: function (loginRes) {
              //发起请求获取登录态
              console.log("code:" + loginRes.code);
              saveSession(loginRes.code);
              //判断权限
              wx.getStorage({
                key: 'session',
                success: function(res) {
                  //验证session
                  authSession(res.data);
                },
              })
              
            }
          })
        }
        
      } 
    },
    fail:function(){
      wx.showToast({
        title: 'session验证请求失败！',
      })
    }
  })
}
