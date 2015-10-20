import { log } from './utils'

export default function() {
  this
    .on('annotation_error', ({ annotation, error }) =>
      this.error(`with ${annoation}`, error))

    .on('start', (name) => this.time(name))

    .on('complete', (name, format = '%s finished after %dms') =>
      this.time_end(name, format))



    // .on('fly_run', ({ path }) =>
    //   log(`Flying with ${fmt.path}...`, path))
    //
    // .on('flyfile_not_found', ({ error }) =>
    //   log(`No Flyfile Error: ${fmt.error}`, error))
    //
    // .on('fly_watch', () =>
    //   log(`${fmt.warn}`, 'Watching files...'))
    //
    // .on('plugin_load', ({ plugin }) =>
    //   log(`Loading plugin ${fmt.title}`, plugin))
    //
    // .on('plugin_error', ({ plugin, error }) =>
    //   log(`${fmt.error} failed due to ${fmt.error}`, plugin, error))
    //
    // .on('task_error', ({ task, error }) => {
    //   trace(error)
    //   log(`${fmt.error} failed due to ${fmt.error}`, task, error)
    // })
    //
    // .on('task_start', ({ task }) =>
    //   log(`Starting ${fmt.start}`, task))
    //
    // .on('task_complete', ({ task, duration }) => {
    //   const time = timeInfo(duration)
    //   log(`Finished ${fmt.complete} in ${fmt.secs}`,
    //     task, time.duration, time.scale)
    // })
}