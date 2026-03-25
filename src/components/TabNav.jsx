import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Icon from './Icon';

const TabNav = ({ parent, activeTab, setTab, onReorder, pageNames = {} }) => {
    const children = parent.children || [];
    const overview = { id: parent.id, label: 'Overview', icon: 'LayoutGrid' };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        
        const items = Array.from(children);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        onReorder(items);
    };

    return (
        <div className="mb-10 overflow-x-auto no-scrollbar pb-2">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="tabs" direction="horizontal">
                    {(provided) => (
                        <div 
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="flex gap-2 p-1 bg-base-200 rounded-2xl w-fit border border-base-300 shadow-inner"
                        >
                            {/* Overview Button - Fixed at start */}
                            <button
                                onClick={() => setTab(overview.id)}
                                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === overview.id ? 'bg-primary text-primary-content shadow-md' : 'text-slate-600 hover:text-primary hover:bg-base-300/50'}`}
                            >
                                <Icon name={overview.icon} size={14} />
                                {overview.label}
                            </button>

                            {/* Draggable Children */}
                            {children.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                        <button
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => setTab(item.id)}
                                            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap group
                                                ${snapshot.isDragging ? 'bg-primary/20 scale-105 shadow-2xl z-50 ring-2 ring-primary' : (activeTab === item.id ? 'bg-primary text-primary-content shadow-md' : 'text-slate-600 hover:text-primary hover:bg-base-300/50')}`}
                                        >
                                            <Icon 
                                                name={item.icon === parent.icon && item.id !== parent.id ? 'Circle' : item.icon} 
                                                size={14} 
                                                className={snapshot.isDragging ? 'hidden' : 'group-hover:hidden'}
                                            />
                                            <Icon 
                                                name="GripHorizontal" 
                                                size={14} 
                                                className={snapshot.isDragging ? 'block text-primary' : 'hidden group-hover:block text-primary-content/50'}
                                            />
                                            {pageNames[item.id] || item.label}
                                        </button>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};

export default TabNav;
