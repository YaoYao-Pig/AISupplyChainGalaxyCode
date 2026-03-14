import React from 'react';
import i18n from './utils/i18n.js';

export default class LanguageSwitcher extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      language: i18n.getLanguage()
    };
    this.handleLanguageChange = this.handleLanguageChange.bind(this);
    this.handleI18nChange = this.handleI18nChange.bind(this);
  }

  componentDidMount() {
    i18n.onChange(this.handleI18nChange);
  }

  componentWillUnmount() {
    i18n.offChange(this.handleI18nChange);
  }

  handleI18nChange(nextLanguage) {
    this.setState({ language: nextLanguage });
  }

  handleLanguageChange(nextLanguage, e) {
    if (e) e.preventDefault();
    i18n.setLanguage(nextLanguage);
  }

  render() {
    const language = this.state.language;
    const className = this.props.className ? 'language-switcher ' + this.props.className : 'language-switcher';

    return (
      <div className={className}>
        <span className='language-switcher-label'>{i18n.t('language.label')}</span>
        <button
          className={'language-switcher-btn' + (language === 'en' ? ' active' : '')}
          onClick={this.handleLanguageChange.bind(this, 'en')}
          type='button'
        >
          EN
        </button>
        <button
          className={'language-switcher-btn' + (language === 'zh' ? ' active' : '')}
          onClick={this.handleLanguageChange.bind(this, 'zh')}
          type='button'
        >
          中
        </button>
      </div>
    );
  }
}