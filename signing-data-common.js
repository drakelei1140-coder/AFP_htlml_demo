function getSigningConfig(page){
  const map={
    'signed-enterprises.html':{title:'已签约企业',tab:'enterprise',state:'已签约企业'},
    'cancelled-enterprises.html':{title:'取消签约企业',tab:'enterprise',state:'取消签约企业'},
    'rejected-enterprises.html':{title:'拒绝签约企业',tab:'enterprise',state:'拒绝签约企业'},
    'signed-shops.html':{title:'已签约商铺',tab:'shop',state:'已签约商铺'},
    'cancelled-shops.html':{title:'取消签约商铺',tab:'shop',state:'取消签约商铺'},
    'rejected-shops.html':{title:'拒绝签约商铺',tab:'shop',state:'拒绝签约商铺'}
  };return map[page];
}
