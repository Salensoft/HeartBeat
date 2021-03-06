/*
 * 关于
 * @author: 蝉時雨
 * @date: 2018-07-15
 */

import React, { PureComponent } from 'react'
import { connect } from 'dva'
import _ from 'lodash'
import Gitalk from 'gitalk'
import classNames from 'classnames/bind'

import Transition from '../../components/Transition'
import Loading from '../../components/Loading'
import Quote from '../../components/Quote'
import Segment from '../../components/Segment'
import config from '../../config'
import styles from './index.less'

const { gitalkOption, aboutOption, qoutes, themeColors } = config
const { avatar, info, enableGitalk } = aboutOption
const cx = classNames.bind(styles)
const colors = _.shuffle(themeColors)

class About extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      showLoading: true,
    }
  }

  componentDidMount() {
    this.props.dispatch({
      type: 'global/queryPage',
      payload: { type: 'about' }
    })
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.loading && !_.isEmpty(nextProps.about)) {
      this.setState({ showLoading: false })
    }
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: 'global/updateState',
      payload: { about: {} },
    })
  }

  // 渲染评论
  renderGitalk = () => {
    if (enableGitalk) {
      const gitalk = new Gitalk({
        ...gitalkOption,
        title: '关于',
      })
      gitalk.render('gitalk')
    }  
  }

  render({ about, loading }, { showLoading }) {
    const section = about.body &&
      about.body.split('## ').filter(o => o.length).map(o => {
        const title = o.match(/.+?\r\n/)[0]
        return {
          title,
          content: o.slice(title.length)
        }
      })

    return (
      <div class={cx('container')}>
        <Transition
          visible={!loading && !showLoading}
          animation='drop'
          duration={600}
          onShow={this.renderGitalk}
        >
          <div class={cx('body')}>
            <Quote text={qoutes.about} />
            <div>
              <div class={cx('header')}>
                <img src={avatar} alt="" />
                <div class={cx('info')}>
                  {info.length && info.map((o, i) => {
                    return (
                      <span key={i}>
                        <i className={`fa fa-${o.icon}`} aria-hidden='true'></i> {o.text}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div class={cx('content')}>
                {section && section.map((o, i) => {
                  const color = colors[i]
                  return (
                    <Segment key={i} color={color} title={o.title} content={o.content} />
                  )
                })}
              </div>
            </div>
          </div>
        </Transition>
        {enableGitalk && <div id='gitalk' />}
        {showLoading && <Loading className={cx('loading')} />}
      </div>
    )
  }
}

export default connect(({ global, loading }) => ({
  about: global.about,
  loading: loading.effects['global/queryPage']
}))(About)