// src/services/syncToNotion.ts
import { Client } from '@notionhq/client';

// Initialize Notion client with your API key
const notion = new Client({ auth: 'ntn_pE5751190343WGFXj7pmnOxZGemf0OGfLUlaL4BmWlr8hU' });

// The Notion page ID where databases will be created
const NOTION_PAGE_ID = '1de02247-9eba-807b-9106-d196a89024f6';

export const syncCanvasDataToNotion = async (payload: { courses: any[], assignments: any[] }) => {
  try {
    const { courses, assignments } = payload;
    console.log('📝 Starting sync to Notion...');
    
    // Map to store course ID to database ID mapping
    const courseDatabases = new Map<number, string>();
    
    // Create a database for each course
    for (const course of courses) {
      console.log(`Creating database for course: ${course.name}`);
      
      try {
        const newDb = await notion.databases.create({
          parent: {
            type: "page_id",
            page_id: NOTION_PAGE_ID,
          },
          title: [
            {
              type: "text",
              text: {
                content: course.name,
              },
            },
          ],
          properties: {
            Name: {
              title: {},
            },
            DueDate: {
              date: {},
            },
            Points: {
              number: {},
            },
            URL: {
              url: {},
            },
            Status: {
              select: {
                options: [
                  { name: "Not Started", color: "red" },
                  { name: "In Progress", color: "yellow" },
                  { name: "Completed", color: "green" },
                ]
              }
            }
          },
        });
        
        courseDatabases.set(course.id, newDb.id);
        console.log(`✅ Created database for ${course.name}`);
      } catch (err) {
        console.error(`❌ Failed to create database for ${course.name}:`, err);
      }
    }
    
    // Add assignments to their respective course databases
    for (const assignment of assignments) {
      const databaseId = courseDatabases.get(assignment.courseId);
      
      if (databaseId) {
        try {
          // Format the due date if it exists
          const dueDate = assignment.due_at 
            ? { date: { start: new Date(assignment.due_at).toISOString() } }
            : null;
            
          await notion.pages.create({
            parent: {
              type: "database_id",
              database_id: databaseId,
            },
            properties: {
              Name: {
                title: [
                  {
                    text: {
                      content: assignment.name,
                    },
                  },
                ],
              },
              DueDate: dueDate ? dueDate : { date: null },
              Points: {
                number: assignment.points_possible,
              },
              URL: {
                url: assignment.html_url,
              },
              Status: {
                select: {
                  name: "Not Started"
                }
              }
            },
            children: [
              {
                object: "block",
                heading_2: {
                  rich_text: [
                    {
                      text: {
                        content: "Assignment Details",
                      },
                    },
                  ],
                },
              },
              {
                object: "block",
                paragraph: {
                  rich_text: [
                    {
                      text: {
                        content: assignment.description 
                          ? stripHtmlTags(assignment.description)
                          : "No description available",
                      },
                    },
                  ],
                },
              },
            ],
          });
          
          console.log(`✅ Added assignment "${assignment.name}" to ${assignment.courseName}`);
        } catch (err) {
          console.error(`❌ Failed to add assignment "${assignment.name}":`, err);
        }
      }
    }
    
    console.log('✅ Successfully synced Canvas data to Notion!');
  } catch (err) {
    console.error('❌ Failed to sync Canvas data to Notion:', err);
  }
};

// Helper function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};