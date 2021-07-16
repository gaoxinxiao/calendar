import React, { useEffect, useState, useRef } from 'react'
import dayjs from 'dayjs'
import './style.scss'

const throttle = (fun: (val: any) => void, time: number) => {
  let delay = 0
  return (...params: any) => {
    const now = +new Date()
    if (now - delay > time) {
      fun.apply(this, params)
      delay = now
    }
  }
}

type weekType = {
  id: number,
  name: string
}
type toutchType = { x: number, y: number }

type dayjsType = Array<dayjs.Dayjs>

type generateWeekDataType = {
  currenWeekFirstDay: dayjs.Dayjs,
  generateWeekDateList: Array<dayjsType>
}

type generateMonthDataType = {
  currentMonthFirstDay: dayjs.Dayjs,
  generateMonthDateList: Array<dayjsType>
}

/**
 *
 * @param {*} dayjsDate dayjs对象
 */
const generateMonthData = (dayjsDate: dayjs.Dayjs): generateMonthDataType => {
  //返回当前月份的第一天
  const currentMonthFirstDay = dayjsDate.startOf('month')
  // 返回当月的第一周第一天
  const currentMonthStartDay = currentMonthFirstDay.startOf('week')

  //上一个月
  const prevMonthFirstDay = currentMonthFirstDay.subtract(1, 'month')
  const prevMonthStartDay = prevMonthFirstDay.startOf('week')

  //下一个月
  const nextMonthFirstDay = currentMonthFirstDay.add(1, 'month')
  const nextMonthStartDay = nextMonthFirstDay.startOf('week')

  return {
    currentMonthFirstDay,
    generateMonthDateList: [
      new Array(42).fill('').map((_, index) => prevMonthStartDay.add(index, 'day')),
      new Array(42).fill('').map((_, index) => currentMonthStartDay.add(index, 'day')),
      new Array(42).fill('').map((_, index) => nextMonthStartDay.add(index, 'day')),
    ],
  }
}

/**
 *
 * @param {*} dayjsDate dayjs对象
 */
const generateWeekData = (dayjsDate: dayjs.Dayjs): generateWeekDataType => {
  const currenWeekStartDay = dayjsDate.startOf('week')
  const prevWeekStartDay = currenWeekStartDay.subtract(1, 'week')
  const nextWeekStartDay = currenWeekStartDay.add(1, 'week')
  return {
    currenWeekFirstDay: currenWeekStartDay,
    generateWeekDateList: [
      new Array(7).fill('').map((_, index) => prevWeekStartDay.add(index, 'day')),
      new Array(7).fill('').map((_, index) => currenWeekStartDay.add(index, 'day')),
      new Array(7).fill('').map((_, index) => nextWeekStartDay.add(index, 'day')),
    ],
  }
}

const CalendarComp = () => {

  const { current } = useRef({
    currentDate: dayjs().format('YYYY-MM-DD'),
    isTouch: false,
    touchStartX: 0,
    touchStartY: 0,
    calendarRef: { offsetWidth: 0 }
  })

  const dayjsDate = dayjs(current.currentDate)
  const { currentMonthFirstDay, generateMonthDateList = [] } = generateMonthData(dayjsDate)
  const { currenWeekFirstDay, generateWeekDateList = [] } = generateWeekData(dayjsDate)

  const [mounthFirstDay, setMounthFirstDay] = useState<dayjs.Dayjs>(currentMonthFirstDay)
  const [mountDateList, setMountDateList] = useState<Array<dayjsType>>(generateMonthDateList)// 月日历需要展示的日期 包括前一月 当月 下一月
  const [weekFirstDay, setWeekFirstDay] = useState<dayjs.Dayjs>(currenWeekFirstDay)// 周日历需要展示的日期  包括前一周 当周 下一周
  const [weekDateList, setWeekDateList] = useState<Array<dayjsType>>(generateWeekDateList)
  const [selectDate, setSelectDate] = useState<string>(current.currentDate)
  const [moveIndex, setMoveIndex] = useState<number>(0)
  const [touch, setTouch] = useState<toutchType>({ x: 0, y: 0 }) //Y轴
  const [isMountView, setIsMountView] = useState<boolean>(false) //true/周日历 false/月日历
  const [weekInd, selectWeekInd] = useState<number>(0) //记录周日历选中的index

  const weekList: Array<weekType> = [{
    id: 0,
    name: '日'
  }, {
    id: 1,
    name: '一'
  }, {
    id: 2,
    name: '二'
  }, {
    id: 3,
    name: '三'
  }, {
    id: 4,
    name: '四'
  }, {
    id: 5,
    name: '五'
  }, {
    id: 6,
    name: '六'
  }]

  //获取周
  const getWeekDate = (cDate: string): weekType => {
    const day = new Date(cDate).getDay()
    return weekList[day];
  }

  const handleTouchStart = (e: any) => {
    e.stopPropagation()
    const touchs = e.touches[0]
    current.touchStartX = touchs.clientX
    current.touchStartY = touchs.clientY
    current.isTouch = true
  }

  const handleTouchMove = throttle((e: any) => {
    e.stopPropagation()
    const touchs = e.touches[0]
    const moveX = touchs.clientX - current.touchStartX
    const moveY = touchs.clientY - current.touchStartY
    const calendarWidth = current.calendarRef.offsetWidth
    if (Math.abs(moveX) > Math.abs(moveY)) {
      // 左右滑动
      setTouch({ x: moveX / calendarWidth, y: 0 })
    }
  }, 25)

  const handleTouchEnd = (e: any) => {
    e.stopPropagation()
    current.isTouch = false
    const touchX = Math.abs(touch.x)
    const touchY = Math.abs(touch.y)
    const newTranslateIndex = touch.x > 0 ? moveIndex + 1 : moveIndex - 1

    if (touchX > touchY && touchX > 0.15) {

      if (isMountView) {
        //周日历
        const nextWeekFirstDay = weekFirstDay[touch.x > 0 ? 'subtract' : 'add'](1, 'week')
        const { currenWeekFirstDay = null, generateWeekDateList = [] } = generateWeekData(nextWeekFirstDay)

        updateWeekView(newTranslateIndex, currenWeekFirstDay, generateWeekDateList)

        //周日历滚动默认选中
        const currentWeekDays = generateWeekDateList[1]
        const selectWeekDay = currentWeekDays[weekInd]
        const formtSelectWeekDay = handelFormtDate(selectWeekDay, 'YYYY-MM-DD')
        setSelectDate(formtSelectWeekDay)

      } else {
        //月日历
        const nextMonthFirstDay = mounthFirstDay[touch.x > 0 ? 'subtract' : 'add'](1, 'month')
        const { currentMonthFirstDay = null, generateMonthDateList = [] } = generateMonthData(nextMonthFirstDay)
        updateMounthView(newTranslateIndex, currentMonthFirstDay, generateMonthDateList)
      }
    }
    setTouch({ x: 0, y: 0 })
  }

  //更新月日历视图
  const updateMounthView = (index: number, currentFirstDay: any, dateList: Array<dayjsType>): void => {
    setMoveIndex(index)
    setMounthFirstDay(currentFirstDay)
    setMountDateList(dateList)
  }

  //更新周日历视图
  const updateWeekView = (index: number, currentFirstDay: any, dateList: Array<dayjsType>): void => {
    setMoveIndex(index)
    setWeekFirstDay(currentFirstDay)
    setWeekDateList(dateList)
  }

  const handelFormtDate = (date: dayjs.Dayjs | string, exp: string): string => {
    return dayjs(date).format(exp)
  }

  //日历选中逻辑
  const handelSelectDate = (formtDate: string, isOtherMonthDay: boolean, index: number) => {
    let selectM = handelFormtDate(formtDate, 'YYYYMM')
    let currentM = handelFormtDate(mounthFirstDay, 'YYYYMM')
    if (!isOtherMonthDay) {
      //在当月点击上一个月或者下一个月
      const { generateMonthDateList = [] } = generateMonthData(dayjs(formtDate))
      const newTranslateIndex = selectM < currentM ? moveIndex + 1 : moveIndex - 1
      updateMounthView(newTranslateIndex, dayjs(formtDate), generateMonthDateList)
    }

    if (isMountView) {
      //周日历 记录选中的位置
      selectWeekInd(index)
    }

    //更新日历选中样式
    setSelectDate(formtDate)
  }

  //渲染选中样式
  const renderClassName = (formtDate: string): string => {
    if (selectDate === formtDate) return 'selectDay'
    if (formtDate === current.currentDate) return 'currentDay'
    return ''
  }

  //月日历/周日历切换
  const handelIsMountView = () => {
    const dayjsDate = dayjs(selectDate)
    const { generateWeekDateList = [], generateMonthDateList = [] } = {
      ...generateMonthData(dayjsDate),
      ...generateWeekData(dayjsDate)
    }

    const flag = !isMountView
    if (flag) {
      //更新周日历
      setWeekFirstDay(dayjsDate)
      setWeekDateList(generateWeekDateList)
      handelSetWeekIndex(selectDate, generateWeekDateList)
    } else {
      //更新月日历
      setMounthFirstDay(dayjsDate)
      setMountDateList(generateMonthDateList)
    }
    setIsMountView(flag)

  }

  //设置周日历选中的位置
  const handelSetWeekIndex = (selectDate: string | dayjs.Dayjs, generateWeekDateList: Array<{ [key: string]: any }>): void => {

    const currentWeekDateList = generateWeekDateList[1]
    let weekIndex = 0
    currentWeekDateList.forEach((v: any, index: number) => {
      if (handelFormtDate(v, 'YYYY-MM-DD') === selectDate) weekIndex = index
    })
    selectWeekInd(weekIndex)
  }


  useEffect(() => {
    if (!isMountView) {
      //月日历
      let currentM = handelFormtDate(mounthFirstDay, 'YYYY-MM-DD')
      setSelectDate(currentM)
    }
  }, [mounthFirstDay])

  useEffect(() => {
    handelSetWeekIndex(current.currentDate, weekDateList)
    setSelectDate(current.currentDate)
  }, [])

  return <div className='calendar_comp'>
    <header>
      <span>{handelFormtDate(isMountView ? weekFirstDay : mounthFirstDay, 'YYYY年MM月')}</span>
    </header>
    <p className='week_list'>
      {
        weekList.map(item => {
          return <span key={item.id}>{item.name}</span>
        })
      }
    </p>
    <div className={`calendar_comp_wrap ${isMountView ? 'pushHei' : 'pullHei'}`}
      ref={(e: any) => current.calendarRef = e}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className='calendar_comp_section' style={{
        transform: `translateX(${-moveIndex * 100}%)`,
      }}
      >
        {
          (isMountView ? weekDateList : mountDateList).map((item, index) => {
            return <ul key={index} className='calendar_list_day'
              style={{
                transform: `translateX(${(index - 1 + moveIndex + (current.isTouch ? touch.x : 0)) * 100
                  }%)`,
                transitionDuration: `${current.isTouch ? 0 : 0.3}s`
              }}
            >
              {
                item.map((date, ind) => {
                  const isOtherMonthDay = isMountView || date.isSame(mounthFirstDay, 'month')
                  const formtDate = handelFormtDate(date, 'YYYY-MM-DD')

                  return <li
                    key={ind}
                    onClick={() => {
                      handelSelectDate(formtDate, isOtherMonthDay, ind)
                    }}
                    style={{ color: isOtherMonthDay ? '#333333' : '#CCCCCC' }}
                  >
                    <span className={renderClassName(formtDate)}>{date.format('DD')}</span>
                  </li>
                })
              }
            </ul>
          })
        }
      </div>
    </div>
    {/* <img className='calendar_pull' src={`/images/${isMountView ? 'calendar_push' : 'calendarpull'}.svg`} alt="" /> */}
    <span className='calendar_pull' onClick={() => {
      handelIsMountView()
    }}>{isMountView ? '展开' : '收起'}</span>
    <p className='current_day'>{handelFormtDate(selectDate, 'MM月DD日')} {`周${getWeekDate(selectDate)?.name}`} </p>
  </div >
}

const ScheduleList = () => {
  return <>
    <div className='schedule_view_wrap'>
      <div className='schedule_list_section'>
        {/* 日历组件 */}
        <CalendarComp />
      </div>
    </div>
  </>
}
export default ScheduleList


