import Injectable from 'utils/injectable';

class BranchPostController extends Injectable {
  constructor(...injections) {
    super(BranchPostController.$inject, injections);

    this.isLoading = true;
    
    // Possible states: show, maximise.
    this.previewState = 'show';

    this.tabItems = [
      'vote',
      'discussion',
      'results',
    ];

    this.tabStates = [
      'weco.branch.post.vote',
      ['weco.branch.post.discussion', 'weco.branch.post.comment'],
      'weco.branch.post.results',
    ];
    
    this.tabStateParams = [{
      branchid: this.BranchService.branch.id,
      postid: this.$state.params.postid,
    }, {
      branchid: this.BranchService.branch.id,
      postid: this.$state.params.postid,
    }, {
      branchid: this.BranchService.branch.id,
      postid: this.$state.params.postid,
    }];

    this.redirect = this.redirect.bind(this);

    let listeners = [];

    listeners.push(this.EventService.on(this.EventService.events.STATE_CHANGE_SUCCESS, this.redirect));
    listeners.push(this.EventService.on(this.EventService.events.CHANGE_POST, this.redirect));

    this.$scope.$on('$destroy', () => listeners.forEach(deregisterListener => deregisterListener()));
  }

  canPreviewPost() {
    const allowedPreviewPostTypes = ['image', 'text', 'video', 'poll'];
    return allowedPreviewPostTypes.includes(this.PostService.post.type);
  }

  getPreviewTemplate() {
    return `/app/pages/branch/post/templates-preview/${this.PostService.post.type}.html`;
  }

  getVideoEmbedUrl() {
    const isYouTubeUrl = url => {
      if (url && '' !== url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
          return true;
        }
      }
      return false;
    };

    if ('video' === this.PostService.post.type && isYouTubeUrl(this.PostService.post.data.text)) {
      let video_id = this.PostService.post.data.text.split('v=')[1] || this.PostService.post.data.text.split('embed/')[1];
      
      if (video_id.includes('&')) {
        video_id = video_id.substring(0, video_id.indexOf('&'));
      }

      return `//www.youtube.com/embed/${video_id}?rel=0`;
    }

    return '';
  }

  redirect() {
    // post not updated yet, wait for CHANGE_POST event
    if (this.$state.params.postid !== this.PostService.post.id) {
      return;
    }

    // update state params for tabs
    for (let i in this.tabStateParams) {
      this.tabStateParams[i].branchid = this.PostService.post.branchid;
      this.tabStateParams[i].postid = this.PostService.post.id;
    }

    if (this.PostService.post.type === 'poll' && this.$state.current.name === 'weco.branch.post') {
      const tabIndex = this.tabItems.indexOf(this.$state.params.tab || 'vote');

      if (tabIndex !== -1) {
        const state = Array.isArray(this.tabStates[tabIndex]) ? this.tabStates[tabIndex][0] : this.tabStates[tabIndex];
        this.$state.go(state, {
          branchid: this.PostService.post.branchid,
          postid: this.$state.params.postid,
        }, {
          location: 'replace',
        });
      }
      else {
        console.warn(`Invalid tab name!`);
      }
    }
    else {
      this.isLoading = false;
    }
  }

  setPreviewState(state) {
    this.previewState = state;
  }

  showPollTabs() {
    return this.PostService.post.type === 'poll';
  }

  toggleCinemaMode() {
    this.previewState = this.previewState === 'maximise' ? 'show' : 'maximise';
  }

  togglePreviewState() {
    // Needs ternary expression as there is also the 'maximise' state.
    this.previewState = this.previewState === 'hide' ? 'show' : 'hide';
  }
}

BranchPostController.$inject = [
  '$rootScope',
  '$scope',
  '$state',
  '$timeout',
  'AppService',
  'BranchService',
  'EventService',
  'ModalService',
  'PostService',
  'UserService',
  'WallService',
];

export default BranchPostController;
