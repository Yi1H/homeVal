let list = [1,2,3,4]
// 2*3*4 1
// 1*3*4 2
// ...


// 剔除当前项，计算其他项的乘积
let demo2 = (arr) => {
  if (!arr) return ;
  let result;
  list.length && list.forEach((i, index) => {
    let newArr = list.splice(index);
    result = newArr.reduce((cur, next) => {
      return cur * next
    })
    return result;
  }) 
}


// 当前项的答案 = 左边所有数的积 * 右边所有数的乘积
function demo4(arr) {
  const len = arr.length;
  const result = new Array(len).fill(0);
  let left = 1;
  for (let i = 0; i < len; i++) {
    result[i] = left;
    left *= arr[i];
  }
  let right = 1;
  for (let i = len - 1; i >= 0; i--) {
    result[i] *= right;
    right *= arr[i];
  }
  return result;
}

// 先遍历总乘积再遍历单项，用总乘积除当前项
function demo3(arr) {
  const len = arr.length;
  const result = new Array(len).fill(0);
  let totalProduct = 1;
  for (let i = 0; i < n; i++) {
    totalProduct *= nums[i];
  }

  for (let i = 0; i < n; i++) {
    result[i] = totalProduct / nums[i];
  }

  return result;
}
