// created by gpake
(function() {

var app = getApp();

var config = {
    qiniuRegion: '',
    qiniuImageURLPrefix: '',
    qiniuUploadToken: '',
    qiniuUploadTokenURL: '',
    qiniuUploadTokenFunction: null,
    session:null
}

module.exports = {
    init: init,
    upload: upload,
    uploadMulti: uploadMulti
}

// 在整个程序生命周期中，只需要 init 一次即可
// 如果需要变更参数，再调用 init 即可
function init(options) {
    config = {
        qiniuRegion: 'ECN',
        qiniuImageURLPrefix: app.IMAGE_DOMAIN,//资源domain
        qiniuUploadToken: '',
        qiniuUploadTokenURL: app.REQUEST_URL + '/api/qiniu/token',
        qiniuUploadTokenFunction: null
    };
    updateConfigWithOptions(options);
}

function updateConfigWithOptions(options) {

    // if (options.qiniuRegion) {
    //   config.qiniuRegion = options.qiniuRegion;
    // } else {
    //     console.error('qiniu uploader need your bucket region');
    // }
    // if (options.uptoken) {
    //     config.qiniuUploadToken = options.uptoken;
    // } else if (options.uptokenURL) {
    //     config.qiniuUploadTokenURL = options.uptokenURL;
    // } else if(options.uptokenFunc) {
    //     config.qiniuUploadTokenFunction = options.uptokenFunc;
    // }
    // if (options.domain) {
    //     config.qiniuImageURLPrefix = options.domain;
    // }
    if (options.session){
      config.session = options.session;
    }
}

  function uploadMulti(filePaths, success, fail, nullDo, options){
  if (filePaths.length == 0){
    nullDo();
  }
  for (var i = 0; i < filePaths.length; i++) {
    upload(filePaths[i], success, fail, options);
  }
}

function upload(filePath, success, fail, options) {
    if (null == filePath) {
        console.error('qiniu uploader need filePath to upload');
        return;
    }
    if (options) {
        init(options);
    }
    if (config.qiniuUploadToken) {
        doUpload(filePath, success, fail, options);
    } else if (config.qiniuUploadTokenURL) {
        getQiniuToken(function() {
            doUpload(filePath, success, fail, options);
        });
    } else if (config.qiniuUploadTokenFunction) {
        config.qiniuUploadToken = config.qiniuUploadTokenFunction();
    } else {
        console.error('qiniu uploader need one of [uptoken, uptokenURL, uptokenFunc]');
        return;
    }
}

function doUpload(filePath, success, fail, options) {
    var url = uploadURLFromRegionCode(config.qiniuRegion);
    var fileName = filePath.split('//')[1];
    if (options && options.key) {
        fileName = options.key;
    }
    var formData = {
        'token': config.qiniuUploadToken,
        'key': fileName
    };
    wx.uploadFile({
        url: url,
        filePath: filePath,
        name: 'file',
        formData: formData,
        success: function (res) {
            var dataString = res.data
            var dataObject = JSON.parse(dataString);
            //do something
            var imageUrl = config.qiniuImageURLPrefix + dataObject.key;
            dataObject.imageURL = imageUrl;
            console.log(dataObject);
            if (success) {
                success(dataObject);
            }
        },
        fail: function (error) {
            console.log(error);
            if (fail) {
                fail(error);
            }
        }
    })
}

function getQiniuToken(callback) {
  wx.request({
    url: config.qiniuUploadTokenURL,
    header:{
      'SESSION': config.session
    },
    success: function (res) {
      var token = res.data.uptoken;
      config.qiniuUploadToken = token;
      if (callback) {
          callback();
      }
    },
    fail: function (error) {
      wx.showToast({
        title: 'token获取失败！'
      })
      console.log(error);
    }
  })
}

function uploadURLFromRegionCode(code) {
    var uploadURL = null;
    switch(code) {
      case 'ECN': uploadURL = 'https://upload.qbox.me'; break;
        case 'NCN': uploadURL = 'https://up-z1.qbox.me'; break;
        case 'SCN': uploadURL = 'https://up-z2.qbox.me'; break;
        case 'NA': uploadURL = 'https://up-na0.qbox.me'; break;
        default: console.error('please make the region is with one of [ECN, SCN, NCN, NA]');
    }
    return uploadURL;
}

})();