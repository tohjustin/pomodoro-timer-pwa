import { mountComponent, destroyVueInstance } from '../utils.js'
import App from 'src/App.vue'

describe('App', () => {
  let vm = null
  let STATE = null

  beforeEach(() => {
    vm = mountComponent(App, {})
    STATE = vm._getStateHelper()
    // **NOTE** PhantomJS doesn't support Audio Tags so we have to stub these 2 methods that interacts w/ HTML5 Audio
    // sinon.stub(vm, '_ringAlarm')
    // sinon.stub(vm, '_stopAlarm')
    // sinon.stub(vm, '_preloadAudio')

    // Alternate way to stub to improve test coverage
    let audioObject = vm.$refs.audio
    audioObject.play = () => {}
    audioObject.pause = () => {}
  })

  afterEach(() => {
    destroyVueInstance(vm)
  })

  describe('Test [STATE] helper object', () => {
    it('method STATE.GET_MODE() should be implemented correctly', () => {
      expect(STATE.GET_MODE(STATE.WORK_START)).to.equal('WORK')
      expect(STATE.GET_MODE(STATE.WORK)).to.equal('WORK')
      expect(STATE.GET_MODE(STATE.WORK_PAUSED)).to.equal('WORK')
      expect(STATE.GET_MODE(STATE.BREAK_START)).to.equal('BREAK')
      expect(STATE.GET_MODE(STATE.BREAK)).to.equal('BREAK')
      expect(STATE.GET_MODE(STATE.BREAK_PAUSED)).to.equal('BREAK')
    })
    it('method STATE.START() should be implemented correctly', () => {
      expect(STATE.START(STATE.WORK_START)).to.equal(STATE.WORK)
      expect(STATE.START(STATE.WORK)).to.equal(STATE.WORK)
      expect(STATE.START(STATE.WORK_PAUSED)).to.equal(STATE.WORK)
      expect(STATE.START(STATE.BREAK_START)).to.equal(STATE.BREAK)
      expect(STATE.START(STATE.BREAK)).to.equal(STATE.BREAK)
      expect(STATE.START(STATE.BREAK_PAUSED)).to.equal(STATE.BREAK)
    })
    it('method STATE.PAUSE() should be implemented correctly', () => {
      expect(STATE.PAUSE(STATE.WORK_START)).to.equal(STATE.WORK_PAUSED)
      expect(STATE.PAUSE(STATE.WORK)).to.equal(STATE.WORK_PAUSED)
      expect(STATE.PAUSE(STATE.WORK_PAUSED)).to.equal(STATE.WORK_PAUSED)
      expect(STATE.PAUSE(STATE.BREAK_START)).to.equal(STATE.BREAK_PAUSED)
      expect(STATE.PAUSE(STATE.BREAK)).to.equal(STATE.BREAK_PAUSED)
      expect(STATE.PAUSE(STATE.BREAK_PAUSED)).to.equal(STATE.BREAK_PAUSED)
    })
    it('method STATE.RESET() should be implemented correctly', () => {
      expect(STATE.RESET(STATE.WORK_START)).to.equal(STATE.WORK_START)
      expect(STATE.RESET(STATE.WORK)).to.equal(STATE.WORK_START)
      expect(STATE.RESET(STATE.WORK_PAUSED)).to.equal(STATE.WORK_START)
      expect(STATE.RESET(STATE.BREAK_START)).to.equal(STATE.BREAK_START)
      expect(STATE.RESET(STATE.BREAK)).to.equal(STATE.BREAK_START)
      expect(STATE.RESET(STATE.BREAK_PAUSED)).to.equal(STATE.BREAK_START)
    })
    it('method STATE.SWITCH() should be implemented correctly', () => {
      expect(STATE.SWITCH(STATE.WORK_START)).to.equal(STATE.BREAK_START)
      expect(STATE.SWITCH(STATE.WORK)).to.equal(STATE.BREAK_START)
      expect(STATE.SWITCH(STATE.WORK_PAUSED)).to.equal(STATE.BREAK_START)
      expect(STATE.SWITCH(STATE.BREAK_START)).to.equal(STATE.WORK_START)
      expect(STATE.SWITCH(STATE.BREAK)).to.equal(STATE.WORK_START)
      expect(STATE.SWITCH(STATE.BREAK_PAUSED)).to.equal(STATE.WORK_START)
    })
  })

  describe('Test Computed Properties', () => {
    it('[overlayText] converts [timeRemaining] into a correct format', () => {
      vm.timeRemaining = 0
      vm.workDuration = 1000
      vm.breakDuration = 1000
      expect(vm.overlayText).to.equal('00:00')
      vm.timeRemaining = 25
      expect(vm.overlayText).to.equal('00:25')
      vm.timeRemaining = (1 * 60) + 0
      expect(vm.overlayText).to.equal('01:00')
      vm.timeRemaining = (11 * 60) + 6
      expect(vm.overlayText).to.equal('11:06')
    })
    it('[fractionOfTimeLeft] calculates the correct value in "WORK" mode', () => {
      vm.workDuration = 100
      vm.breakDuration = 200
      const statesToTest = [ STATE.WORK_START, STATE.WORK, STATE.WORK_PAUSED ]
      for (var i = 0; i < statesToTest.length; i++) {
        vm.state = statesToTest[i]
        vm.timeRemaining = 0
        expect(vm.fractionOfTimeLeft).to.equal(0)
        vm.timeRemaining = 55
        expect(vm.fractionOfTimeLeft).to.equal(0.55)
        vm.timeRemaining = 100
        expect(vm.fractionOfTimeLeft).to.equal(1)
      }
    })
    it('[fractionOfTimeLeft] calculates the correct value in "BREAK" mode', () => {
      vm.workDuration = 100
      vm.breakDuration = 200
      const statesToTest = [ STATE.BREAK_START, STATE.BREAK, STATE.BREAK_PAUSED ]
      for (var i = 0; i < statesToTest.length; i++) {
        vm.state = statesToTest[i]
        vm.timeRemaining = 0
        expect(vm.fractionOfTimeLeft).to.equal(0)
        vm.timeRemaining = 55
        expect(vm.fractionOfTimeLeft).to.equal(0.275)
        vm.timeRemaining = 110
        expect(vm.fractionOfTimeLeft).to.equal(0.55)
        vm.timeRemaining = 200
        expect(vm.fractionOfTimeLeft).to.equal(1)
      }
    })
    it('[primaryButton] is computed correctly', () => {
      let startTimerSpy = sinon.spy(vm, 'startTimer')
      let pauseTimerSpy = sinon.spy(vm, 'pauseTimer')
      expect(startTimerSpy.callCount).to.equal(0)
      expect(pauseTimerSpy.callCount).to.equal(0)

      vm.state = STATE.WORK_START
      expect(vm.primaryButton).to.have.deep.property('text', 'START WORKING')
      expect(vm.primaryButton).to.have.deep.property('bgColor', '#2196F3')
      vm.primaryButton.callbackFn()
      expect(startTimerSpy.callCount).to.equal(1)
      expect(pauseTimerSpy.callCount).to.equal(0)
      startTimerSpy.reset()
      pauseTimerSpy.reset()

      vm.state = STATE.WORK
      expect(vm.primaryButton).to.have.deep.property('text', 'STOP WORKING')
      expect(vm.primaryButton).to.have.deep.property('bgColor', '#2196F3')
      vm.primaryButton.callbackFn()
      expect(startTimerSpy.callCount).to.equal(0)
      expect(pauseTimerSpy.callCount).to.equal(1)
      startTimerSpy.reset()
      pauseTimerSpy.reset()

      vm.state = STATE.WORK_PAUSED
      expect(vm.primaryButton).to.have.deep.property('text', 'RESUME WORKING')
      expect(vm.primaryButton).to.have.deep.property('bgColor', '#2196F3')
      vm.primaryButton.callbackFn()
      expect(startTimerSpy.callCount).to.equal(1)
      expect(pauseTimerSpy.callCount).to.equal(0)
      startTimerSpy.reset()
      pauseTimerSpy.reset()

      vm.state = STATE.BREAK_START
      expect(vm.primaryButton).to.have.deep.property('text', 'START MY BREAK')
      expect(vm.primaryButton).to.have.deep.property('bgColor', '#7CB342')
      vm.primaryButton.callbackFn()
      expect(startTimerSpy.callCount).to.equal(1)
      expect(pauseTimerSpy.callCount).to.equal(0)
      startTimerSpy.reset()
      pauseTimerSpy.reset()

      vm.state = STATE.BREAK
      expect(vm.primaryButton).to.have.deep.property('text', 'STOP MY BREAK')
      expect(vm.primaryButton).to.have.deep.property('bgColor', '#7CB342')
      vm.primaryButton.callbackFn()
      expect(startTimerSpy.callCount).to.equal(0)
      expect(pauseTimerSpy.callCount).to.equal(1)
      startTimerSpy.reset()
      pauseTimerSpy.reset()

      vm.state = STATE.BREAK_PAUSED
      expect(vm.primaryButton).to.have.deep.property('text', 'RESUME MY BREAK')
      expect(vm.primaryButton).to.have.deep.property('bgColor', '#7CB342')
      vm.primaryButton.callbackFn()
      expect(startTimerSpy.callCount).to.equal(1)
      expect(pauseTimerSpy.callCount).to.equal(0)
      startTimerSpy.reset()
      pauseTimerSpy.reset()

      vm.state = ''
      expect(vm.primaryButton).to.have.deep.property('text', 'ERROR')
      expect(vm.primaryButton).to.have.deep.property('bgColor', '#FFFFFF')
      vm.primaryButton.callbackFn()
      expect(startTimerSpy.callCount).to.equal(0)
      expect(pauseTimerSpy.callCount).to.equal(0)
      startTimerSpy.reset()
      pauseTimerSpy.reset()
    })
  })

  describe('Test Component Methods', () => {
    it('[startTimer] decrements [timeRemaining] every second in "WORK" mode', () => {
      const statesToTest = [ STATE.WORK_START, STATE.WORK, STATE.WORK_PAUSED ]
      for (var i = 0; i < statesToTest.length; i++) {
        const CLOCK = sinon.useFakeTimers()
        // Initialize component properties/variables
        vm.timeRemaining = 20
        vm.workDuration = 20
        vm.breakDuration = 10
        vm.state = statesToTest[i]
        vm.worker = null
        expect(vm.state).to.equal(statesToTest[i])
        expect(vm.worker).to.be.null

        // Begin Test
        vm.startTimer()
        expect(vm.state).to.equal(STATE.WORK)
        expect(vm.timeRemaining).to.equal(20)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(500)
        expect(vm.state).to.equal(STATE.WORK)
        expect(vm.timeRemaining).to.equal(20)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(500)
        expect(vm.state).to.equal(STATE.WORK)
        expect(vm.timeRemaining).to.equal(19)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(2000)
        expect(vm.state).to.equal(STATE.WORK)
        expect(vm.timeRemaining).to.equal(17)
        expect(vm.worker).not.to.be.null

        CLOCK.restore()
      }
    })
    it('[startTimer] decrements [timeRemaining] every second in "BREAK" mode', () => {
      const statesToTest = [ STATE.BREAK_START, STATE.BREAK, STATE.BREAK_PAUSED ]
      for (var i = 0; i < statesToTest.length; i++) {
        const CLOCK = sinon.useFakeTimers()
        // Initialize component properties/variables
        vm.timeRemaining = 10
        vm.workDuration = 20
        vm.breakDuration = 10
        vm.state = statesToTest[i]
        vm.worker = null
        expect(vm.state).to.equal(statesToTest[i])
        expect(vm.worker).to.be.null

        // Begin Test
        vm.startTimer()
        expect(vm.state).to.equal(STATE.BREAK)
        expect(vm.timeRemaining).to.equal(10)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(500)
        expect(vm.state).to.equal(STATE.BREAK)
        expect(vm.timeRemaining).to.equal(10)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(500)
        expect(vm.state).to.equal(STATE.BREAK)
        expect(vm.timeRemaining).to.equal(9)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(2000)
        expect(vm.state).to.equal(STATE.BREAK)
        expect(vm.timeRemaining).to.equal(7)
        expect(vm.worker).not.to.be.null

        CLOCK.restore()
      }
    })
    it('[startTimer] switches from "WORK" to "BREAK" mode when [timeRemaining] approaches 0', () => {
      const CLOCK = sinon.useFakeTimers()
      let spy = sinon.spy(vm, 'triggerAlarm')

      // Initialize component properties/variables
      vm.timeRemaining = 1
      vm.workDuration = 20
      vm.breakDuration = 10
      vm.state = STATE.WORK
      vm.worker = null
      expect(vm.state).to.equal(STATE.WORK)
      expect(vm.worker).to.be.null

      // Begin Test
      vm.startTimer()
      expect(spy.callCount).to.equal(0)
      expect(vm.state).to.equal(STATE.WORK)
      expect(vm.timeRemaining).to.equal(1)
      expect(vm.worker).not.to.be.null
      CLOCK.tick(500)
      expect(spy.callCount).to.equal(0)
      expect(vm.state).to.equal(STATE.WORK)
      expect(vm.timeRemaining).to.equal(1)
      expect(vm.worker).not.to.be.null
      CLOCK.tick(500)
      expect(spy.callCount).to.equal(1)
      expect(vm.state).to.equal(STATE.BREAK_START)
      expect(vm.timeRemaining).to.equal(10)
      expect(vm.worker).to.be.null
      CLOCK.tick(2000)
      expect(spy.callCount).to.equal(1)
      expect(vm.state).to.equal(STATE.BREAK_START)
      expect(vm.timeRemaining).to.equal(10)
      expect(vm.worker).to.be.null

      CLOCK.restore()
    })
    it('[startTimer] switches from "BREAK" to "WORK" mode when [timeRemaining] approaches 0', () => {
      const CLOCK = sinon.useFakeTimers()
      let spy = sinon.spy(vm, 'triggerAlarm')

      // Initialize component properties/variables
      vm.timeRemaining = 1
      vm.workDuration = 20
      vm.breakDuration = 10
      vm.state = STATE.BREAK
      vm.worker = null
      expect(vm.state).to.equal(STATE.BREAK)
      expect(vm.worker).to.be.null

      // Begin Test
      vm.startTimer()
      expect(spy.callCount).to.equal(0)
      expect(vm.state).to.equal(STATE.BREAK)
      expect(vm.timeRemaining).to.equal(1)
      expect(vm.worker).not.to.be.null
      CLOCK.tick(500)
      expect(spy.callCount).to.equal(0)
      expect(vm.state).to.equal(STATE.BREAK)
      expect(vm.timeRemaining).to.equal(1)
      expect(vm.worker).not.to.be.null
      CLOCK.tick(500)
      expect(spy.callCount).to.equal(1)
      expect(vm.state).to.equal(STATE.WORK_START)
      expect(vm.timeRemaining).to.equal(20)
      expect(vm.worker).to.be.null
      CLOCK.tick(2000)
      expect(spy.callCount).to.equal(1)
      expect(vm.state).to.equal(STATE.WORK_START)
      expect(vm.timeRemaining).to.equal(20)
      expect(vm.worker).to.be.null

      // Restore Timer
      CLOCK.restore()
    })
    it('[startTimer] stops the alarm', () => {
      // Restore the stubbed function so we can mock it
      // vm._ringAlarm.restore()
      // vm._stopAlarm.restore()

      // Setup mocks
      var mock = sinon.mock(vm)
      var ringAlarmExpectation = mock.expects('_ringAlarm')
      var stopAlarmExpectation = mock.expects('_stopAlarm')
      ringAlarmExpectation.never()
      stopAlarmExpectation.once()

      // Verify it
      vm.startTimer()
      ringAlarmExpectation.verify()
      stopAlarmExpectation.verify()
    })
    it('[pauseTimer] stops decrementing [timeRemaining] every second in "WORK" mode', () => {
      const statesToTest = [ STATE.WORK_START, STATE.WORK, STATE.WORK_PAUSED ]
      for (var i = 0; i < statesToTest.length; i++) {
        const CLOCK = sinon.useFakeTimers()
        // Initialize component properties/variables
        vm.timeRemaining = 20
        vm.workDuration = 20
        vm.breakDuration = 10
        vm.state = statesToTest[i]
        vm.worker = null
        expect(vm.state).to.equal(statesToTest[i])
        expect(vm.worker).to.be.null

        // Begin Test
        vm.startTimer()
        expect(vm.state).to.equal(STATE.WORK)
        expect(vm.timeRemaining).to.equal(20)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(2000)
        expect(vm.state).to.equal(STATE.WORK)
        expect(vm.timeRemaining).to.equal(18)
        expect(vm.worker).not.to.be.null

        vm.pauseTimer()
        expect(vm.state).to.equal(STATE.WORK_PAUSED)
        expect(vm.timeRemaining).to.equal(18)
        expect(vm.worker).to.be.null
        CLOCK.tick(2000)
        expect(vm.state).to.equal(STATE.WORK_PAUSED)
        expect(vm.timeRemaining).to.equal(18)
        expect(vm.worker).to.be.null

        CLOCK.restore()
      }
    })
    it('[pauseTimer] stops decrementing [timeRemaining] every second in "BREAK" mode', () => {
      const statesToTest = [ STATE.BREAK_START, STATE.BREAK, STATE.BREAK_PAUSED ]
      for (var i = 0; i < statesToTest.length; i++) {
        const CLOCK = sinon.useFakeTimers()
        // Initialize component properties/variables
        vm.timeRemaining = 10
        vm.workDuration = 20
        vm.breakDuration = 10
        vm.state = statesToTest[i]
        vm.worker = null
        expect(vm.state).to.equal(statesToTest[i])
        expect(vm.worker).to.be.null

        // Begin Test
        vm.startTimer()
        expect(vm.state).to.equal(STATE.BREAK)
        expect(vm.timeRemaining).to.equal(10)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(3000)
        expect(vm.state).to.equal(STATE.BREAK)
        expect(vm.timeRemaining).to.equal(7)
        expect(vm.worker).not.to.be.null

        vm.pauseTimer()
        expect(vm.state).to.equal(STATE.BREAK_PAUSED)
        expect(vm.timeRemaining).to.equal(7)
        expect(vm.worker).to.be.null
        CLOCK.tick(3000)
        expect(vm.state).to.equal(STATE.BREAK_PAUSED)
        expect(vm.timeRemaining).to.equal(7)
        expect(vm.worker).to.be.null

        CLOCK.restore()
      }
    })
    it('[resetTimer] resets [timeRemaining] correctly in "WORK" mode', () => {
      const statesToTest = [ STATE.WORK_START, STATE.WORK, STATE.WORK_PAUSED ]
      for (var i = 0; i < statesToTest.length; i++) {
        const CLOCK = sinon.useFakeTimers()
        // Initialize component properties/variables
        vm.timeRemaining = 15
        vm.workDuration = 20
        vm.breakDuration = 10
        vm.state = statesToTest[i]
        vm.worker = null
        expect(vm.state).to.equal(statesToTest[i])
        expect(vm.worker).to.be.null

        // Begin Test
        vm.startTimer()
        expect(vm.state).to.equal(STATE.WORK)
        expect(vm.timeRemaining).to.equal(15)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(2000)
        expect(vm.state).to.equal(STATE.WORK)
        expect(vm.timeRemaining).to.equal(13)
        expect(vm.worker).not.to.be.null

        vm.resetTimer()
        expect(vm.state).to.equal(STATE.WORK_START)
        expect(vm.timeRemaining).to.equal(20)
        expect(vm.worker).to.be.null
        CLOCK.tick(2000)
        expect(vm.state).to.equal(STATE.WORK_START)
        expect(vm.timeRemaining).to.equal(20)
        expect(vm.worker).to.be.null

        CLOCK.restore()
      }
    })
    it('[resetTimer] resets [timeRemaining] correctly in "BREAK" mode', () => {
      const statesToTest = [ STATE.BREAK_START, STATE.BREAK, STATE.BREAK_PAUSED ]
      for (var i = 0; i < statesToTest.length; i++) {
        const CLOCK = sinon.useFakeTimers()
        // Initialize component properties/variables
        vm.timeRemaining = 5
        vm.workDuration = 20
        vm.breakDuration = 10
        vm.state = statesToTest[i]
        vm.worker = null
        expect(vm.state).to.equal(statesToTest[i])
        expect(vm.worker).to.be.null

        // Begin Test
        vm.startTimer()
        expect(vm.state).to.equal(STATE.BREAK)
        expect(vm.timeRemaining).to.equal(5)
        expect(vm.worker).not.to.be.null
        CLOCK.tick(3000)
        expect(vm.state).to.equal(STATE.BREAK)
        expect(vm.timeRemaining).to.equal(2)
        expect(vm.worker).not.to.be.null

        vm.resetTimer()
        expect(vm.state).to.equal(STATE.BREAK_START)
        expect(vm.timeRemaining).to.equal(10)
        expect(vm.worker).to.be.null
        CLOCK.tick(3000)
        expect(vm.state).to.equal(STATE.BREAK_START)
        expect(vm.timeRemaining).to.equal(10)
        expect(vm.worker).to.be.null

        CLOCK.restore()
      }
    })
    it('[resetTimer] stops the alarm', () => {
      // Restore the stubbed function so we can mock it
      // vm._ringAlarm.restore()
      // vm._stopAlarm.restore()

      // Setup mocks
      var mock = sinon.mock(vm)
      var ringAlarmExpectation = mock.expects('_ringAlarm')
      var stopAlarmExpectation = mock.expects('_stopAlarm')
      ringAlarmExpectation.never()
      stopAlarmExpectation.once()

      // Verify it
      vm.resetTimer()
      ringAlarmExpectation.verify()
      stopAlarmExpectation.verify()
    })
    it('[triggerAlarm] switches from "WORK" mode correctly', () => {
      const CLOCK = sinon.useFakeTimers()
      // Initialize component properties/variables
      vm.timeRemaining = 2
      vm.workDuration = 20
      vm.breakDuration = 10
      vm.state = STATE.WORK
      vm.worker = null
      expect(vm.state).to.equal(STATE.WORK)
      expect(vm.worker).to.be.null

      // Begin Test
      vm.startTimer()
      expect(vm.state).to.equal(STATE.WORK)
      expect(vm.timeRemaining).to.equal(2)
      expect(vm.worker).not.to.be.null
      vm.triggerAlarm()
      expect(vm.state).to.equal(STATE.BREAK_START)
      expect(vm.timeRemaining).to.equal(10)
      expect(vm.worker).to.be.null

      CLOCK.restore()
    })
    it('[triggerAlarm] switches from "BREAK" mode correctly', () => {
      const CLOCK = sinon.useFakeTimers()
      // Initialize component properties/variables
      vm.timeRemaining = 5
      vm.workDuration = 20
      vm.breakDuration = 10
      vm.state = STATE.BREAK
      vm.worker = null
      expect(vm.state).to.equal(STATE.BREAK)
      expect(vm.worker).to.be.null

      // Begin Test
      vm.startTimer()
      expect(vm.state).to.equal(STATE.BREAK)
      expect(vm.timeRemaining).to.equal(5)
      expect(vm.worker).not.to.be.null
      vm.triggerAlarm()
      expect(vm.state).to.equal(STATE.WORK_START)
      expect(vm.timeRemaining).to.equal(20)
      expect(vm.worker).to.be.null

      CLOCK.restore()
    })
    it('[triggerAlarm] rings the alarm if [allowMelody] is true', () => {
      // Restore the stubbed function so we can mock it
      // vm._ringAlarm.restore()
      // vm._stopAlarm.restore()

      // Setup mocks
      var mock = sinon.mock(vm)
      var ringAlarmExpectation = mock.expects('_ringAlarm')
      var stopAlarmExpectation = mock.expects('_stopAlarm')
      ringAlarmExpectation.once()
      stopAlarmExpectation.never()

      // Verify it
      vm.allowMelody = true
      vm.triggerAlarm()
      ringAlarmExpectation.verify()
      stopAlarmExpectation.verify()
    })
    it('[triggerAlarm] rings the alarm if [allowMelody] is false', () => {
      // Restore the stubbed function so we can mock it
      // vm._ringAlarm.restore()
      // vm._stopAlarm.restore()

      // Setup mocks
      var mock = sinon.mock(vm)
      var ringAlarmExpectation = mock.expects('_ringAlarm')
      var stopAlarmExpectation = mock.expects('_stopAlarm')
      ringAlarmExpectation.never()
      stopAlarmExpectation.never()

      // Verify it
      vm.allowMelody = false
      vm.triggerAlarm()
      ringAlarmExpectation.verify()
      stopAlarmExpectation.verify()
    })
    it('[switchToSettingsView] pauses timer', () => {
      let spy = sinon.spy(vm, 'pauseTimer')
      vm.switchToSettingsView()
      expect(spy).to.have.been.calledOnce
    })
    it('[switchToSettingsView] changes [showSettingsView] to true', () => {
      vm.showSettingsView = false
      vm.switchToSettingsView()
      expect(vm.showSettingsView).to.be.true
      vm.switchToSettingsView()
      expect(vm.showSettingsView).to.be.true
    })
    it('[switchToMainView] updates variable based on $emit values', () => {
      vm.workDuration = 1
      vm.breakDuration = 1
      vm.allowMelody = false
      vm.allowVibration = false
      vm.$refs.settings.$emit('change', { workDuration: 10, breakDuration: 10, allowMelody: true, allowVibration: true })
      expect(vm.workDuration).to.equal(10)
      expect(vm.breakDuration).to.equal(10)
      expect(vm.allowMelody).to.be.true
      expect(vm.allowVibration).to.be.true
    })
    it('[switchToMainView] resets timer', () => {
      let spy = sinon.spy(vm, 'resetTimer')
      vm.switchToMainView({ workDuration: 1, breakDuration: 1, allowMelody: false, allowVibration: false })
      expect(spy).to.have.been.calledOnce
    })
    it('[switchToMainView] changes [showSettingsView] to false', () => {
      vm.showSettingsView = true
      vm.switchToMainView({ workDuration: 1, breakDuration: 1, allowMelody: false, allowVibration: false })
      expect(vm.showSettingsView).to.be.false
      vm.switchToMainView({ workDuration: 1, breakDuration: 1, allowMelody: false, allowVibration: false })
      expect(vm.showSettingsView).to.be.false
    })
  })
  describe('Test Component Private Helper Methods', () => {
    it('[_ringAlarm] resets audio file & play', () => {
      var spy = sinon.spy()
      var spy2 = sinon.spy()
      let audioObject = vm.$refs.audio
      audioObject.play = spy
      audioObject.pause = spy2
      audioObject.currentTime = 9999
      vm._ringAlarm()
      expect(audioObject.currentTime).to.equal(0)
      expect(spy).to.have.been.calledOnce
      expect(spy2).to.have.callCount(0)
    })

    it('[_stopAlarm] pauses audio', () => {
      var spy = sinon.spy()
      var spy2 = sinon.spy()
      let audioObject = vm.$refs.audio
      audioObject.play = spy
      audioObject.pause = spy2

      audioObject.paused = false
      vm._stopAlarm()
      expect(spy).to.have.callCount(0)
      expect(spy2).to.have.been.calledOnce

      spy.reset()
      spy2.reset()
      audioObject.paused = true
      vm._stopAlarm()
      expect(spy).to.have.callCount(0)
      expect(spy2).to.have.callCount(0)
    })

    it('[_preloadAudio] play & pause audio', () => {
      var spy = sinon.spy()
      var spy2 = sinon.spy()
      let audioObject = vm.$refs.audio
      audioObject.play = spy
      audioObject.pause = spy2
      vm._preloadAudio()
      expect(spy).to.have.been.calledOnce
      expect(spy2).to.have.been.calledOnce
    })
  })

  describe('Test Child Components', () => {
    it('[radialBar] should render', () => {
      expect(vm.$el.querySelector('.radialBar')).not.to.be.null
    })
    it('[primaryButton] should render', () => {
      expect(vm.$el.querySelector('.primaryButton')).not.to.be.null
    })
    it('[resetButton] should render', () => {
      expect(vm.$el.querySelector('.resetButton')).not.to.be.null
    })
    it('[audio] should render', () => {
      expect(vm.$el.querySelector('.audio')).not.to.be.null
    })
  })
})
