/*
 * 页头
 * @author: 蝉時雨
 * @date: 2018-06-30
 */

import React, { PureComponent } from 'react'
import { connect } from 'dva'
import Link from 'umi/link'
import classNames from 'classnames/bind'

import styles from './index.less'

const cx = classNames.bind(styles)

class Header extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      dropMenu: false,
    }
  }

  componentDidMount() {
    this.bind()
  }

  componentWillUnmount() {
    this.removeBind()
  }

  // 绑定事件
  bind = () => {
    this.menuRef.addEventListener('mouseover', this.handleMouseOver)
  }

  // 注销事件
  removeBind = (e) => {
    this.menuRef.removeEventListener('mouseover', this.handleMouseOver)
  }

  // 监听: 菜单悬停并触发对话
  handleMouseOver = (e) => {
    let target
    if (e.target.tagName.toUpperCase() === 'LI') {
      target = e.target
    } else if (e.target.parentElement.tagName.toUpperCase() === 'LI') {
      target = e.target.parentElement
    } else {
      return
    }
    const menu = target.getAttribute('data-menu')
    if (this.menu === menu) return
    this.menu = menu
    let tips
    switch (menu) {
      case 'home':
        tips = '要回首页看看么~'
        break
      case 'archives':
        tips = '去看看主人的所有文章吧'
        break
      case 'categories':
        tips = '去看看主人的文章吧'
        break
      case 'tags':
        tips = '去看看主人的文章吧'
        break
      case 'shuoshuo':
        tips = '主人最近又在发什么牢骚呢'
        break
      case 'books':
        tips = '主人最近再读什么书呢'
        break
      case 'friends':
        tips = '去看看主人的小伙伴吧'
        break
      case 'about':
        tips = '想要了解更多关于主人的故事么'
        break
      default:
        return
    }
    this.props.dispatch({
      type: 'global/showTips',
      payload: { tips },
    })
  }

  // 移动端展开菜单
  toggleMenu = () => {
    this.setState({ dropMenu: !this.state.dropMenu })
  }

  render(props, { dropMenu }) {

    return (
      <div class={cx('container')}>
        <button
          style={{ top: dropMenu ? '0.8rem' : '0' }}
          onClick={this.toggleMenu}
        >
          <i className="fa fa-list-ul" aria-hidden="true"></i>
        </button>
        <div class={cx('inner')}  style={{ padding: dropMenu ? '1.06rem 0 .24rem' : '.7rem 0 .6rem'}}>
          <a class={cx('title')} href="/">蝉時雨</a>
          <span class={cx('sub-title')}>蝉鸣如雨 花宵道中</span>
          <ul ref={c => this.menuRef = c} class={cx('menu', dropMenu && 'dropMenu')}>
            <li data-menu="home">
              <Link to="/">
                <i class="fa fa-university" aria-hidden="true"></i>
                <span>首页</span>
              </Link>
            </li>
            <li data-menu="archives">
              <Link to="/archives">
                <i class="fa fa-archive" aria-hidden="true"></i>
                <span>归档</span>
              </Link>
            </li>
            <li data-menu="categories">
              <Link to="/categories">
                <i class="fa fa-bookmark" aria-hidden="true"></i>
                <span>分类</span>
              </Link>
            </li>
            <li data-menu="tags">
              <Link to="/tags">
                <i class="fa fa-tags" aria-hidden="true"></i>
                <span>标签</span>
              </Link>
            </li>
            <li data-menu="shuoshuo">
              <Link to="/shuoshuo">
                <i class="fa fa-commenting" aria-hidden="true"></i>
                <span>说说</span>
              </Link>
            </li>
            <li data-menu="books">
              <Link to="/books">
                <i class="fa fa-book" aria-hidden="true"></i>
                <span>书单</span>
              </Link>
            </li>
            <li data-menu="friends">
              <Link to="/friends">
                <i class="fa fa-heartbeat" aria-hidden="true"></i>
                <span>友链</span>
              </Link>
            </li>
            <li data-menu="about">
              <Link to="/about">
                <i class="fa fa-envira" aria-hidden="true"></i>
                <span>关于</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    )
  }
}

export default connect()(Header)