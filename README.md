# Lysias
Web Audio API version of The Tomb of the Grammarian Lysias
"The Tomb of the Grammarian Lysias" is a setting of a poem by Greek poet 
Constantine P. Cavafy for voice and audience members' mobile devices.
The architecture of the project is that the singer is on the Control.html page pushing buttons that write to the cues.json file,
using the Lysias.php script. The audience members go to the index.html page, which polls for updates to the cues.json file,
and when something changes, it triggers the corresponding audio behavior.
Audio behaviors are either some variation on granular synthesis or intermittent sounds.
I'm posting this as a git respository partly as a chance to learn to better use git for myself and also to have a better way
to track my updates and backup my work.  I'm not actively looking for collaborators but am happy to learn from folks.
Future work includes cleaning up the code, busting objects out into their own js files, supporting realtime recording and 
transmission of audio files, genericizing the structure from the content, and eventually setting more Cavafy poems.
