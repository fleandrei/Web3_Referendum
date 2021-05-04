

export function Bytes32ToAddress(str){
  return str.slice(0,2) + str.slice(26);
} 

export function Remove_Numerical_keys(obj){
  var obj_len= obj.length;
  for(var i=0; i<obj_len; i++){
    delete obj[i];
  }
  return obj;
}

export function Remove_Item_Once(array, item){
	var index = array.indexOf(item);
  	if (index > -1) {
   	 array.splice(index, 1);
  	}
  	return array;
}