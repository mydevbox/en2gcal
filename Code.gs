/**
* - en2gcal
* - Evernote to Google Calendar Reminder
*
*  Copyright (c) 2012 Chris Lawson
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

/**
*  @author  Chris Lawson 
*  @version 0.3
*  @since   2013-01-06
*/

/**
*  Find Gmail thread labeled with .reminder and create a Google Calendar event based
*  on the free text description included on the subject line.
*/

/**
*
*  pop:{minutes} - optional - adds a popup reminder using specified minutes
*
*  sms:{minutes} - optional - adds an sms remidner using specified minutes
*
*  email:{minutes} - optional - adds an email reminder using specified minutes
*
*  cal:"{calendar_name}" - optional - adds the reminder to the specified calendar  
*  otherwise default calendar is used.
*  Calendar names with spaces must be enclosed in quotes. "" or ''.
*
*  inc:{0|1} - optional - 1 by default - include copy of note contents in the description
*  of the event.  All html will be removed however breaks and paragraphs are maintained.
*
*  {Evernote note link} - optional - Include the Evernote note link on the subject and it will 
*  be added to the event description as text.  e.g. evernote:///view/999999/s1/...
*
*/

function addReminder() {
  var label = GmailApp.getUserLabelByName('.reminder');
  var threads = label.getThreads();
  var subject = '';
  var cal = '';

  for(i in threads){    
    var params = parseSubject_(threads[i].getFirstMessageSubject());
    var msg = threads[i].getMessages();
    var desc = '';
    params = checkParams_(params);
    
    if ('cal' in params) {
        cal = CalendarApp.getCalendarsByName(params.cal)[0];
    } else {
        cal = CalendarApp.getDefaultCalendar();
    }
        
    if (cal !== '' && cal !== undefined) {
      var event = cal.createEventFromDescription(params.subject);
          
      if (event === undefined) continue;
      
      if ('evernote' in params) desc = "evernote:" + params.evernote + "\n";
                 
      if ('inc' in params && (params.inc === '1' || params.inc === 'true')) {
        var rem_new_lines = msg[0].getBody().replace(/(\r\n|\n|\r)/gm,'');
        var rem_spaces = rem_new_lines.replace(/\s+/g,' ');
        var br_p_2_nl = rem_spaces.replace(/(<br\s*\/?>|<p\s*\/?>)/gi, '\n');
        var rem_tags = br_p_2_nl.replace(/<(?:.|\n)*?>/gm, '');
        var rem_en_banner = rem_tags.replace('From Evernote:','\n');
        var spaces_2_nl = rem_en_banner.replace(/\s{3,}/gm, '\n');
        desc += spaces_2_nl;
      }
      
      if (desc !== '') event.setDescription(desc);
      if ('sms' in params) event.addSmsReminder(params.sms);
      if ('pop' in params) event.addPopupReminder(params.pop);
      if ('email' in params) event.addEmailReminder(params.email);
    }
  }
  label.removeFromThreads(threads);
}

function checkParams_(params) {
  var sms = UserProperties.getProperty('sms');
  var pop = UserProperties.getProperty('pop');
  var email = UserProperties.getProperty('email');
  var cal = UserProperties.getProperty('cal');
  var inc = UserProperties.getProperty('inc') || '1';

  // if param not already specified on subject set to UserProperty if exists
  if (!('sms' in params) && sms) params.sms = sms;
  if (!('pop' in params) && pop) params.pop = pop;
  if (!('email' in params) && email) params.email = email;
  if (!('cal' in params) && cal) params.cal = cal;
  if (!('inc' in params) && inc) params.inc = inc;
  
  return params;
}

function parseSubject_(subject) {
  var keyval =  /([^ \d]+):\s*([^ '"]+|'[^']+'|"[^"]+")/g,
      cleanup = /([^ \d]+):\s*([^ '"]+\s*|'[^']+'\s*|"[^"]+"\s*)/g,
      match, params = {};
  
  while (match = keyval.exec(subject)) {
    params[match[1]] = match[2].replace(/"/g,'').replace(/'/g,"");
  }

  params.subject = subject.replace(cleanup,'');
  return params;
}
