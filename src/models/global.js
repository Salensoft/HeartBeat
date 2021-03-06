import router from 'umi/router'
import _ from 'lodash'
import timeago from 'timeago.js'

import {
  queryTotal,
  queryHot,
  queryPostHot,
  queryCats,
  queryTags,
  queryFilterPost,
  queryShuoShuoTotal,
  queryPage,
  likeSite,
} from '../services'
import { loadImgs } from '../utils'
const t = timeago()
const delay = time => new Promise(resolve => setTimeout(resolve, time))
const minDelay = 1000
let lastTipsUpdateAt

// 文章格式化
const formatPost = (post) => {
  const { created_at, body, labels } = post
  const [desc, content] = body.split('<!-- more -->')
  const result = /http.+(jpg|jpeg|png|gif)/g.exec(desc)
  const cover = result[0]
  post.date = t.format(created_at, 'zh_CN')
  post.cover = cover
  post.desc = desc.split(`${cover})`)[1].trim()
  post.content = content
  post.filterLabels = labels.sort((a, b) => a.name.length >= b.name.length).slice(0, 2)
  return post
}

export default {
  namespace: 'global',
  state: {
    totalList: [],        // 所有文章列表
    postList: [],         // 当前文章列表
    post: {},             // 当前文章内容
    prevPost: {},         // 前篇文章
    nextPost: {},         // 后篇文章

    archives: [],         // 归档
    cats: [],             // 分类
    tags: [],             // 标签

    totalShuoShuo: [],    // 所有说说列表
    shuoshuo: [],         // 说说

    about: {},            // 关于
    books: {},            // 书单
    friends: {},          // 友链

    tips: '',             // live2d 聊天
    lastTipsUpdateAt: '', // 最后一次更新 tips

    isLikeSite: false,    // 是否已点赞
    likeTimes: 0,         //点赞次数
  },
  reducers: {
    updateState(state, { payload }) {
      return { ...state, ...payload }
    },
  },
  effects: {
    // 所有文章
    *queryTotal({ payload }, { call, put }) {
      const totalList = yield call(queryTotal, payload)
      yield put({ type: 'updateState', payload: { totalList } })
    },

    // 首页文章
    *queryList({ payload }, { select, take, call, put }) {
      const startTime = new Date()
      const state = yield select(state => state.global)
      let { totalList, postList } = state
      // 文章列表不存在先获取文章
      if (!totalList.length) {
        yield put({ type: 'queryTotal' })
        yield take('queryTotal/@@end')
        totalList = yield select(state => state.global.totalList)
      }
      const { queryType } = payload
      const length = totalList.length
      let nextPostList = []
      // 直接根据当前文章的角标来截取
      if (postList.length) {
        if (queryType === 'prev') {
          const endInx = totalList.findIndex(o => o.id === postList[0].id)
          for (let i = 1; i < 5; i++) {
            const addInx = endInx - i < 0 ? length + endInx - i : endInx - i
            nextPostList.unshift(totalList[addInx])
          }
        } else if (queryType === 'next') {
          const startInx = totalList.findIndex(o => o.id === postList[3].id)
          for (let i = 1; i < 5; i++) {
            const addInx = startInx + i < length ? startInx + i : startInx + i - length
            nextPostList.push(totalList[addInx])
          }
        } else if (queryType === 'add') {
          const endInx = totalList.findIndex(o => o.id === postList[postList.length - 1].id)
          for (let i = 1; i < 5; i++) {
            const addInx = endInx + i
            if (addInx >= totalList.length) continue
            nextPostList.push(totalList[addInx])
          }
          nextPostList = postList.concat(nextPostList)
        }
      } else {
        nextPostList = totalList.slice(0, 4)
      }
      let images = []
      _.forEach(nextPostList, (post) => {
        formatPost(post)
        images.push(post.cover)
      })
      nextPostList = yield call(queryHot, { postList: nextPostList }) // 获取热度
      yield call(loadImgs, { images, width: 240, height: 135 })       // 加载预览小图
      const delayTime = new Date() - startTime
      if (delayTime < minDelay && queryType !== 'add') {
        yield call(delay, minDelay - delayTime)
      }
      yield put({ type: 'updateState', payload: { postList: nextPostList } })
    },

    // 文章内容
    *queryPost({ payload }, { select, take, call, put }) {
      const startTime = new Date()
      let totalList = yield select(state => state.global.totalList)
      // 文章列表不存在先获取文章
      if (!totalList.length) {
        yield put({ type: 'queryTotal' })
        yield take('queryTotal/@@end')
        totalList = yield select(state => state.global.totalList)
      }
      let index = totalList.findIndex(post => post.number === parseInt(payload.number, 10))
      // 若文章不存在则跳转首页
      if (!totalList[index]) {
        router.push('/')
        return
      }
      // 前篇和后篇
      let post = formatPost(totalList[index])
      let prevPost = formatPost(totalList[index - 1] || totalList[totalList.length - 1])
      let nextPost = formatPost(totalList[index + 1] || totalList[0])
      post = yield call(queryPostHot, { post })
      prevPost = yield call(queryPostHot, { post: prevPost, add: false })
      nextPost = yield call(queryPostHot, { post: nextPost, add: false })
      const delayTime = new Date() - startTime
      if (delayTime < minDelay) {
        yield call(delay, minDelay - delayTime)
      }
      yield put({ type: 'updateState', payload: { post, prevPost, nextPost } })
    },

    // 归档文章
    *queryArchives({ payload }, { select, take, call, put }) {
      const startTime = new Date()
      const state = yield select(state => state.global)
      let { totalList, archives } = state
      // 说说列表不存在先获取说说
      if (!totalList.length) {
        yield put({ type: 'queryTotal' })
        yield take('queryTotal/@@end')
        totalList = yield select(state => state.global.totalList)
      }
      const { queryType } = payload
      // 直接根据当前归档的角标来截取
      if (archives.length) {
        // 计算当前页
        const index = totalList.findIndex(o => o.id === archives[0].id)
        const curPage = index / 12 + 1
        const nextPage = queryType === 'next' ? curPage + 1 : curPage - 1
        archives = totalList.slice((nextPage - 1) * 12, nextPage * 12)
      } else {
        archives = totalList.slice(0, 12)
      }
      const delayTime = new Date() - startTime
      if (delayTime < minDelay) {
        yield call(delay, minDelay - delayTime)
      }
      yield put({ type: 'updateState', payload: { archives } })
    },

    // 分类列表
    *queryCats({ payload }, { call, put }) {
      const startTime = new Date()
      const cats = yield call(queryCats, payload)
      const delayTime = new Date() - startTime
      if (delayTime < minDelay) {
        yield call(delay, minDelay - delayTime)
      }
      yield put({ type: 'updateState', payload: { cats } })
    },

    // 标签列表
    *queryTags({ payload }, { call, put }) {
      const startTime = new Date()
      const tags = yield call(queryTags, payload)
      const delayTime = new Date() - startTime
      if (delayTime < minDelay) {
        yield call(delay, minDelay - delayTime)
      }
      yield put({ type: 'updateState', payload: { tags } })
    },

    // 根据分类和标签筛选文章
    *filterPost({ payload }, { call, put }) {
      const filterPost = yield call(queryFilterPost, payload)
      return filterPost
    },

    // 说说列表
    *queryShuoShuoTotal({ payload }, { call, put }) {
      const totalShuoShuo = yield call(queryShuoShuoTotal, payload)
      yield put({ type: 'updateState', payload: { totalShuoShuo } })
    },

    // 当前说说
    *queryShuoShuo({ payload }, { select, take, call, put }) {
      const startTime = new Date()
      const state = yield select(state => state.global)
      let { totalShuoShuo, shuoshuo } = state
      // 说说列表不存在先获取说说
      if (!totalShuoShuo.length) {
        yield put({ type: 'queryShuoShuoTotal' })
        yield take('queryShuoShuoTotal/@@end')
        totalShuoShuo = yield select(state => state.global.totalShuoShuo)
      }
      const { queryType } = payload
      // 直接根据当前说说的角标来截取
      if (shuoshuo.length) {
        // 计算当前页
        const index = totalShuoShuo.findIndex(o => o.id === shuoshuo[0].id)
        const curPage = index / 6 + 1
        const nextPage = queryType === 'next' ? curPage + 1 : curPage - 1
        shuoshuo = totalShuoShuo.slice((nextPage - 1) * 6, nextPage * 6)
      } else {
        shuoshuo = totalShuoShuo.slice(0, 6)
      }
      const delayTime = new Date() - startTime
      if (delayTime < minDelay) {
        yield call(delay, minDelay - delayTime)
      }
      yield put({ type: 'updateState', payload: { shuoshuo } })
    },

    // 书单/友链/关于
    *queryPage({ payload }, { call, put }) {
      const startTime = new Date()
      const { type } = payload
      const data = yield call(queryPage, payload)
      const delayTime = new Date() - startTime
      if (delayTime < minDelay) {
        yield call(delay, minDelay - delayTime)
      }
      yield put({ type: 'updateState', payload: { [type]: data } })
    },

    // 看板娘文字
    *showTips({ payload }, { select, call, put }) {
      lastTipsUpdateAt = new Date()
      yield put({ type: 'updateState', payload: { tips: payload.tips } })
      yield call(delay, 6000)
      // 6s 内未再更新则隐藏
      if ((new Date() - lastTipsUpdateAt) > 6000) {
        yield put({ type: 'updateState', payload: { tips: '', lastTipsUpdateAt: new Date() } })
      }
    },
    
    // 加载缓存
    *loadStorage({ payload }, { call, put }) {
      const isLikeSite = window.localStorage.getItem('isLikeSite', true)
      const likeTimes = yield call(likeSite, { type: 'getTime' })
      yield put({ type: 'updateState', payload: { isLikeSite, likeTimes } })
    },

    // 喜欢小站
    *likeSite({ payload }, { call, put }) {
      const likeTimes = yield call(likeSite)
      window.localStorage.setItem('isLikeSite', true)
      yield put({ type: 'updateState', payload: { likeTimes, isLikeSite: true } })
    },
  },

  // 启动
  subscriptions: {
    setup({ dispatch }) {
      dispatch({ type: 'queryTotal' })  // 获取所有文章
      dispatch({ type: 'loadStorage' }) // 加载本地缓存
    },
  },
}
