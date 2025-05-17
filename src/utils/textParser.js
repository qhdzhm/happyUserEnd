/**
 * 文本解析工具 - 用于从自由文本中提取结构化的预订信息
 */

/**
 * 从文本中提取预订信息
 * @param {string} text - 中介提供的预订文本
 * @returns {Object} - 提取的预订信息对象
 */
export const extractBookingInfo = (text) => {
  if (!text || typeof text !== 'string') {
    return {};
  }

  const result = {
    tourName: '',            // 服务类型/团名
    tourStartDate: '',       // 出发日期
    tourEndDate: '',         // 结束日期
    flightNumber: '',        // 到达航班
    returnFlightNumber: '',  // 返程航班
    departureTime: '',       // 出发时间
    pickupLocation: '',      // 接客地点
    dropoffLocation: '',     // 送客地点
    serviceType: '',         // 服务类型
    groupSize: 0,            // 团队人数
    adultCount: 0,           // 成人数量
    childCount: 0,           // 儿童数量
    luggageCount: 0,         // 行李数量
    passengers: [],          // 乘客信息
    roomType: '',            // 房型
    hotelLevel: '',          // 酒店级别
    specialRequests: '',     // 特殊要求
  };

  // 提取服务类型/团名
  const tourNameMatch = text.match(/服务类型[：:]\s*(.+?)(?:\r?\n|$)/);
  if (tourNameMatch) {
    result.tourName = tourNameMatch[1].trim();
    // 设置服务类型为"跟团游"，如果文本中包含"跟团"
    if (result.tourName.includes('跟团') || text.includes('跟团')) {
      result.serviceType = '跟团游';
    } else if (result.tourName.includes('日游') || text.includes('日游')) {
      result.serviceType = '日游';
    }
  }

  // 提取参团日期
  const dateMatch = text.match(/参团日期(?:（.*?）)?[：:]\s*(.+?)(?:\r?\n|$)/);
  if (dateMatch) {
    let dateStr = dateMatch[1].trim();
    // 处理常见的日期格式
    if (dateStr.match(/\d+月\d+日/)) {
      // 转换中文日期格式为标准格式
      const yearMatch = dateStr.match(/(\d{4})年/) || [null, new Date().getFullYear()];
      const monthMatch = dateStr.match(/(\d+)月/);
      const dayMatch = dateStr.match(/(\d+)日/);
      
      if (monthMatch && dayMatch) {
        const year = yearMatch[1];
        const month = monthMatch[1].padStart(2, '0');
        const day = dayMatch[1].padStart(2, '0');
        result.tourStartDate = `${year}-${month}-${day}`;
        
        // 尝试根据团名估算行程天数并计算结束日期
        const durationMatch = result.tourName.match(/(\d+)日/) || result.tourName.match(/(\d+)天/);
        if (durationMatch) {
          const duration = parseInt(durationMatch[1], 10);
          const endDate = new Date(result.tourStartDate);
          endDate.setDate(endDate.getDate() + duration - 1);
          result.tourEndDate = endDate.toISOString().split('T')[0];
        }
      }
    } else if (dateStr.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
      // 处理日/月/年格式
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        const month = parts[1].padStart(2, '0');
        const day = parts[0].padStart(2, '0');
        result.tourStartDate = `${year}-${month}-${day}`;
      }
    } else if (dateStr.match(/\d{4}-\d{1,2}-\d{1,2}/)) {
      // 已经是标准格式
      result.tourStartDate = dateStr;
    }
  }

  // 提取航班信息
  const arrivalFlightMatch = text.match(/(?:到达|抵达|到港|航班(?:到达)?|航班到达)[：:]*\s*([A-Z]{2}\d+|[A-Z]{1}\d+|[A-Z]{3}\d+)/i);
  if (arrivalFlightMatch) {
    result.flightNumber = arrivalFlightMatch[1].toUpperCase();
  }

  const returnFlightMatch = text.match(/(?:返程|回程|返航|回程航班)[：:]*\s*([A-Z]{2}\d+|[A-Z]{1}\d+|[A-Z]{3}\d+)/i);
  if (returnFlightMatch) {
    result.returnFlightNumber = returnFlightMatch[1].toUpperCase();
  }

  // 提取出发时间
  const departureTimeMatch = text.match(/出发时间[：:]\s*(.+?)(?:\r?\n|$)/);
  if (departureTimeMatch) {
    result.departureTime = departureTimeMatch[1].trim();
  }

  // 提取接送地点
  const pickupLocationMatch = text.match(/(?:出发地点|接客地点|接机地点)[：:]\s*(.+?)(?:\r?\n|$)/);
  if (pickupLocationMatch) {
    result.pickupLocation = pickupLocationMatch[1].trim();
  }
  // 如果没有明确指定，但提到了机场，则假设为机场接送
  if (!result.pickupLocation && text.includes('机场')) {
    result.pickupLocation = text.match(/(.{2,10}机场)/)?.[1] || '霍巴特机场';
  }
  
  // 默认送客地点与接客地点相同
  result.dropoffLocation = result.pickupLocation;

  // 提取人数信息
  const groupSizeMatch = text.match(/(?:跟团人数|团队人数|人数)[：:]\s*(\d+)(?:\D|$)/);
  if (groupSizeMatch) {
    result.groupSize = parseInt(groupSizeMatch[1], 10);
    // 默认成人数量等于团队人数
    result.adultCount = result.groupSize;
  }
  
  // 如果文本明确提到儿童，则调整成人数量
  const childMatch = text.match(/儿童[：:]*\s*(\d+)/);
  if (childMatch) {
    result.childCount = parseInt(childMatch[1], 10);
    result.adultCount = result.groupSize - result.childCount;
  }

  // 提取行李数量
  const luggageMatch = text.match(/(?:行李数|行李数量)[：:]\s*(\d+)(?:\D|$)/);
  if (luggageMatch) {
    result.luggageCount = parseInt(luggageMatch[1], 10);
  }

  // 提取房型信息
  const roomTypeMatch = text.match(/(?:房型|房间类型)[：:]\s*(.+?)(?:\r?\n|$)/);
  if (roomTypeMatch) {
    const roomTypeText = roomTypeMatch[1].trim().toLowerCase();
    if (roomTypeText.includes('双') || roomTypeText.includes('两') || roomTypeText.includes('2')) {
      result.roomType = roomTypeText.includes('床') ? '标准双人间' : '双人间';
    } else if (roomTypeText.includes('单') || roomTypeText.includes('1')) {
      result.roomType = '单人间';
    } else if (roomTypeText.includes('三') || roomTypeText.includes('3')) {
      result.roomType = '三人间';
    } else {
      result.roomType = roomTypeText;
    }
  }

  // 提取酒店级别
  const hotelLevelMatch = text.match(/(?:酒店级别|酒店等级)[：:]\s*(.+?)(?:\r?\n|$)/);
  if (hotelLevelMatch) {
    const levelText = hotelLevelMatch[1].trim();
    // 检查是否包含星级数字
    const starMatch = levelText.match(/(\d+(?:\.\d+)?)(?:星级?)?/);
    if (starMatch) {
      result.hotelLevel = `${starMatch[1]}星`;
    } else {
      result.hotelLevel = levelText;
    }
  }

  // 提取乘客信息
  // 这部分比较复杂，我们尝试识别常见的模式
  const passengerSection = text.match(/乘客信息[：:]([\s\S]*?)(?:房型|酒店级别|行程安排|备注|$)/i);
  
  if (passengerSection) {
    const passengerText = passengerSection[1].trim();
    // 分割每个乘客信息行
    const passengerLines = passengerText.split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // 提取每个乘客的信息
    for (const line of passengerLines) {
      const passenger = {
        fullName: '',
        phone: '',
        passportNumber: '',
        isChild: false,
        childAge: null
      };
      
      // 名字通常在行的开始
      const nameMatch = line.match(/^([^0-9(（]+)/);
      if (nameMatch) {
        passenger.fullName = nameMatch[1].trim();
        
        // 检查是否为儿童
        if (passenger.fullName.includes('儿童') || passenger.fullName.toLowerCase().includes('child')) {
          passenger.isChild = true;
          
          // 尝试提取儿童年龄
          const ageMatch = passenger.fullName.match(/\d+/);
          if (ageMatch) {
            passenger.childAge = ageMatch[0];
            // 清理名字中的年龄标记
            passenger.fullName = passenger.fullName.replace(/\d+岁?/, '').trim();
          }
        }
      }
      
      // 提取电话号码
      const phoneMatch = line.match(/(?:\+?86)?(?:1[3-9]\d{9}|\d{3,4}[-\s]?\d{3,4}[-\s]?\d{3,4})/);
      if (phoneMatch) {
        passenger.phone = phoneMatch[0].replace(/[-\s]/g, '');
      }
      
      // 提取护照号码 (通常为字母+数字组合)
      const passportMatch = line.match(/[A-Z]{1,2}\d{6,9}|[0-9]{6,12}/);
      if (passportMatch) {
        passenger.passportNumber = passportMatch[0];
      }
      
      if (passenger.fullName || passenger.phone || passenger.passportNumber) {
        result.passengers.push(passenger);
      }
    }
  }
  
  // 如果没有成功提取到乘客信息但有团队人数，创建占位乘客
  if (result.passengers.length === 0 && result.groupSize > 0) {
    for (let i = 0; i < result.groupSize; i++) {
      result.passengers.push({
        fullName: `乘客${i+1}`,
        phone: '',
        passportNumber: '',
        isChild: false,
        childAge: null
      });
    }
  }

  // 提取特殊要求/备注
  const specialRequestsMatch = text.match(/备注[：:]([\s\S]*?)(?:$)/);
  if (specialRequestsMatch) {
    result.specialRequests = specialRequestsMatch[1].trim();
  }

  // 如果备注没有提取到但文本中包含特殊要求，尝试提取整个特殊要求部分
  if (!result.specialRequests && text.includes('特殊要求')) {
    const specialReqSection = text.match(/特殊要求[：:]([\s\S]*?)(?:$)/);
    if (specialReqSection) {
      result.specialRequests = specialReqSection[1].trim();
    }
  }

  // 尝试匹配其他常见的备注表达方式
  if (!result.specialRequests) {
    const otherMatches = text.match(/(?:其他要求|注意事项|特别说明|备注事项|注意|其他信息|需求|要求)[：:]([\s\S]*?)(?:$)/);
    if (otherMatches) {
      result.specialRequests = otherMatches[1].trim();
    }
  }

  // 如果文本末尾有未被识别的内容，也将其添加到特殊要求中
  const textSections = text.split(/\r?\n\r?\n/);
  if (textSections.length > 0) {
    const lastSection = textSections[textSections.length - 1].trim();
    if (lastSection && 
        !lastSection.match(/^服务类型/) && 
        !lastSection.match(/^参团日期/) &&
        !lastSection.match(/^乘客信息/) &&
        !lastSection.match(/^房型/) &&
        !lastSection.match(/^酒店级别/) &&
        (!result.specialRequests || !result.specialRequests.includes(lastSection))) {
      result.specialRequests = result.specialRequests 
        ? result.specialRequests + '\n' + lastSection 
        : lastSection;
    }
  }

  // 最后一道防线：如果文本中包含明显的备注性质的内容，尝试提取
  if (!result.specialRequests) {
    // 查找任何以"备注"或"要求"开头的行
    const noteLines = text.split(/\r?\n/).filter(line => 
      line.trim().match(/^(备注|要求|特殊|注意|说明|其他).{0,5}[:：]/)
    );
    
    if (noteLines.length > 0) {
      // 提取备注内容（去除"备注："等前缀）
      const cleanedNotes = noteLines.map(line => {
        const content = line.replace(/^(备注|要求|特殊|注意|说明|其他).{0,5}[:：]/, '').trim();
        return content;
      }).filter(content => content.length > 0);
      
      if (cleanedNotes.length > 0) {
        result.specialRequests = cleanedNotes.join('\n');
      }
    }
  }

  // 后处理：根据数据合理性进行调整
  
  // 1. 如果没有明确提取到服务类型，但提到了"跟团"，则设置为"跟团游"
  if (!result.serviceType && text.includes('跟团')) {
    result.serviceType = '跟团游';
  } else if (!result.serviceType) {
    // 默认为"跟团游"
    result.serviceType = '跟团游';
  }
  
  // 2. 如果没有提取到成人/儿童数量但有总人数，则默认全为成人
  if (result.groupSize > 0 && result.adultCount === 0 && result.childCount === 0) {
    result.adultCount = result.groupSize;
  }
  
  // 3. 尝试根据团名推断天数，如果结束日期没有被设置
  if (result.tourStartDate && !result.tourEndDate) {
    // 先尝试从团名中提取
    let durationMatch = result.tourName.match(/(\d+)日/) || result.tourName.match(/(\d+)天/) || result.tourName.match(/(\d+)日游/);
    
    // 如果团名中没有找到，从整个文本尝试匹配行程天数相关的信息
    if (!durationMatch) {
      durationMatch = text.match(/(\d+)(?:日|天)(?:游|跟团)/);
    }
    
    // 如果找到"行程安排"部分，尝试计算总天数
    if (!durationMatch && text.includes('行程安排')) {
      const dayCount = (text.match(/第\d+天/g) || []).length;
      if (dayCount > 0) {
        durationMatch = [null, dayCount.toString()];
      }
    }
    
    if (durationMatch) {
      const duration = parseInt(durationMatch[1], 10);
      const endDate = new Date(result.tourStartDate);
      endDate.setDate(endDate.getDate() + duration - 1);
      result.tourEndDate = endDate.toISOString().split('T')[0];
    }
  }

  return result;
};

export default {
  extractBookingInfo
}; 